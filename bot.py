#!/usr/bin/env python3
"""
NeonWave Radio IRC Bot
Connects to IRC servers and handles song requests via .request command
"""

import asyncio
import websockets
import json
import logging
import os
import re
from datetime import datetime

# IRC library
import socket
import ssl
import threading
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('NeonWaveBot')

class IRCBot:
    def __init__(self, server, port, nick, channels, use_ssl=True):
        self.server = server
        self.port = port
        self.nick = nick
        self.channels = channels if isinstance(channels, list) else [channels]
        self.use_ssl = use_ssl
        self.socket = None
        self.connected = False
        self.running = False
        self.websocket = None
        self.websocket_url = os.getenv('WEBSOCKET_URL', 'ws://localhost:5000/ws')
        
    async def connect_websocket(self):
        """Connect to the web application's WebSocket"""
        try:
            self.websocket = await websockets.connect(self.websocket_url)
            logger.info(f"Connected to WebSocket at {self.websocket_url}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to WebSocket: {e}")
            return False
    
    def connect_irc(self):
        """Connect to IRC server"""
        try:
            # Create socket
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            
            # Enable SSL if requested
            if self.use_ssl:
                context = ssl.create_default_context()
                self.socket = context.wrap_socket(self.socket, server_hostname=self.server)
            
            # Connect to server
            logger.info(f"Connecting to {self.server}:{self.port}")
            self.socket.connect((self.server, self.port))
            
            # Send initial IRC commands
            self.send_raw(f"NICK {self.nick}")
            self.send_raw(f"USER {self.nick} 0 * :NeonWave Radio Bot")
            
            self.connected = True
            logger.info("Connected to IRC server")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to IRC: {e}")
            return False
    
    def send_raw(self, message):
        """Send raw IRC message"""
        if self.socket and self.connected:
            try:
                self.socket.send(f"{message}\r\n".encode('utf-8'))
                logger.debug(f"Sent: {message}")
            except Exception as e:
                logger.error(f"Failed to send message: {e}")
                self.connected = False
    
    def send_message(self, target, message):
        """Send message to channel or user"""
        self.send_raw(f"PRIVMSG {target} :{message}")
    
    def join_channel(self, channel):
        """Join IRC channel"""
        if not channel.startswith('#'):
            channel = f"#{channel}"
        self.send_raw(f"JOIN {channel}")
        logger.info(f"Joining channel {channel}")
    
    async def send_websocket_message(self, message_type, data):
        """Send message to WebSocket"""
        if self.websocket:
            try:
                message = {
                    "type": message_type,
                    "data": data
                }
                await self.websocket.send(json.dumps(message))
                logger.debug(f"Sent WebSocket message: {message}")
            except Exception as e:
                logger.error(f"Failed to send WebSocket message: {e}")
    
    def parse_irc_message(self, raw_message):
        """Parse IRC message"""
        try:
            if raw_message.startswith(':'):
                prefix, message = raw_message[1:].split(' ', 1)
            else:
                prefix = None
                message = raw_message
            
            parts = message.split(' ')
            command = parts[0]
            params = parts[1:]
            
            # Extract nick from prefix
            nick = None
            if prefix and '!' in prefix:
                nick = prefix.split('!')[0]
            
            return {
                'prefix': prefix,
                'nick': nick,
                'command': command,
                'params': params,
                'raw': raw_message
            }
        except Exception as e:
            logger.error(f"Failed to parse IRC message: {e}")
            return None
    
    async def handle_privmsg(self, parsed_msg):
        """Handle PRIVMSG (channel messages)"""
        if len(parsed_msg['params']) < 2:
            return
        
        target = parsed_msg['params'][0]
        message = ' '.join(parsed_msg['params'][1:])
        nick = parsed_msg['nick']
        
        # Remove leading colon from message
        if message.startswith(':'):
            message = message[1:]
        
        logger.info(f"<{nick}> {message}")
        
        # Send message to WebSocket
        await self.send_websocket_message('chat_message', {
            'username': nick,
            'message': message,
            'timestamp': datetime.utcnow().isoformat(),
            'isBot': False
        })
        
        # Handle .request command
        if message.startswith('.request '):
            query = message[9:].strip()  # Remove '.request ' prefix
            if query:
                await self.handle_song_request(nick, query, target)
    
    async def handle_song_request(self, nick, query, channel):
        """Handle song request from IRC"""
        logger.info(f"Song request from {nick}: {query}")
        
        try:
            # Send request to web application API
            import aiohttp
            async with aiohttp.ClientSession() as session:
                api_url = os.getenv('API_URL', 'http://localhost:5000/api/irc/request')
                async with session.post(api_url, json={
                    'username': nick,
                    'query': query
                }) as response:
                    result = await response.json()
                    
                    if result.get('success'):
                        track = result.get('track', {})
                        reply = f"✅ Added \"{track.get('title', 'Unknown')}\" by {track.get('artist', 'Unknown')} to the queue!"
                    else:
                        reply = f"❌ Sorry {nick}, no tracks found for \"{query}\""
                    
                    # Send reply to IRC channel
                    self.send_message(channel, reply)
                    
        except Exception as e:
            logger.error(f"Failed to handle song request: {e}")
            error_reply = f"❌ Sorry {nick}, there was an error processing your request."
            self.send_message(channel, error_reply)
    
    async def irc_message_loop(self):
        """Main IRC message handling loop"""
        buffer = ""
        
        while self.running:
            try:
                if not self.connected:
                    await asyncio.sleep(1)
                    continue
                
                # Receive data from IRC
                self.socket.settimeout(1.0)
                try:
                    data = self.socket.recv(4096).decode('utf-8')
                except socket.timeout:
                    continue
                except Exception as e:
                    logger.error(f"Socket error: {e}")
                    self.connected = False
                    continue
                
                if not data:
                    logger.warning("No data received, connection may be closed")
                    self.connected = False
                    continue
                
                buffer += data
                
                # Process complete lines
                while '\n' in buffer:
                    line, buffer = buffer.split('\n', 1)
                    line = line.strip()
                    
                    if not line:
                        continue
                    
                    logger.debug(f"Received: {line}")
                    
                    # Parse IRC message
                    parsed_msg = self.parse_irc_message(line)
                    if not parsed_msg:
                        continue
                    
                    # Handle different IRC commands
                    command = parsed_msg['command']
                    
                    if command == 'PING':
                        # Respond to PING
                        pong_msg = f"PONG {parsed_msg['params'][0]}"
                        self.send_raw(pong_msg)
                    
                    elif command == '001':  # Welcome message
                        logger.info("Successfully connected to IRC")
                        # Join channels
                        for channel in self.channels:
                            self.join_channel(channel)
                    
                    elif command == 'JOIN':
                        # Someone joined a channel
                        channel = parsed_msg['params'][0]
                        nick = parsed_msg['nick']
                        if nick == self.nick:
                            logger.info(f"Successfully joined {channel}")
                    
                    elif command == 'PRIVMSG':
                        await self.handle_privmsg(parsed_msg)
                
            except Exception as e:
                logger.error(f"Error in IRC message loop: {e}")
                await asyncio.sleep(1)
    
    async def reconnect_loop(self):
        """Handle reconnection to IRC and WebSocket"""
        while self.running:
            try:
                # Check IRC connection
                if not self.connected:
                    logger.info("Attempting to reconnect to IRC...")
                    if self.connect_irc():
                        logger.info("Reconnected to IRC")
                
                # Check WebSocket connection
                if not self.websocket or self.websocket.closed:
                    logger.info("Attempting to reconnect to WebSocket...")
                    if await self.connect_websocket():
                        logger.info("Reconnected to WebSocket")
                
                await asyncio.sleep(10)  # Check every 10 seconds
                
            except Exception as e:
                logger.error(f"Error in reconnect loop: {e}")
                await asyncio.sleep(5)
    
    async def run(self):
        """Main bot run method"""
        self.running = True
        logger.info("Starting NeonWave IRC Bot...")
        
        # Connect to services
        if not self.connect_irc():
            logger.error("Failed to connect to IRC")
            return
        
        if not await self.connect_websocket():
            logger.error("Failed to connect to WebSocket")
        
        # Start background tasks
        tasks = [
            asyncio.create_task(self.irc_message_loop()),
            asyncio.create_task(self.reconnect_loop())
        ]
        
        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            logger.info("Received interrupt signal")
        finally:
            await self.stop()
    
    async def stop(self):
        """Stop the bot"""
        logger.info("Stopping NeonWave IRC Bot...")
        self.running = False
        
        if self.socket:
            try:
                self.send_raw("QUIT :NeonWave Bot shutting down")
                self.socket.close()
            except:
                pass
        
        if self.websocket:
            try:
                await self.websocket.close()
            except:
                pass
        
        logger.info("Bot stopped")

async def main():
    # Configuration
    IRC_SERVER = os.getenv('IRC_SERVER', 'irc.libera.chat')
    IRC_PORT = int(os.getenv('IRC_PORT', '6697'))
    IRC_NICK = os.getenv('IRC_NICK', 'NeonWaveBot')
    IRC_CHANNELS = os.getenv('IRC_CHANNELS', '#neonwave-radio').split(',')
    IRC_USE_SSL = os.getenv('IRC_USE_SSL', 'true').lower() == 'true'
    
    # Create and run bot
    bot = IRCBot(
        server=IRC_SERVER,
        port=IRC_PORT,
        nick=IRC_NICK,
        channels=IRC_CHANNELS,
        use_ssl=IRC_USE_SSL
    )
    
    await bot.run()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Bot stopped by user")
