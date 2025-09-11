#!/usr/bin/env python3
"""
Aegis Backend API Setup Assistant

This script helps you set up all external APIs step by step.

Usage:
    python setup_apis.py
"""

import os
import sys
import webbrowser
from typing import Dict, List


class APISetupAssistant:
    """Interactive assistant for setting up external APIs."""
    
    def __init__(self):
        self.env_vars = {}
        
    def print_header(self, title: str):
        """Print a formatted header."""
        print("\n" + "=" * 60)
        print(f"  {title}")
        print("=" * 60)
        
    def print_step(self, step: str, description: str):
        """Print a formatted step."""
        print(f"\n📋 {step}")
        print(f"   {description}")
        
    def get_user_input(self, prompt: str, required: bool = True, sensitive: bool = False) -> str:
        """Get user input with validation."""
        while True:
            if sensitive:
                import getpass
                value = getpass.getpass(f"{prompt}: ")
            else:
                value = input(f"{prompt}: ").strip()
                
            if value or not required:
                return value
            else:
                print("❌ This field is required. Please enter a value.")
                
    def confirm_action(self, prompt: str) -> bool:
        """Ask user for confirmation."""
        response = input(f"{prompt} (y/n): ").lower().strip()
        return response in ['y', 'yes']
        
    def setup_google_gemini(self):
        """Set up Google Gemini AI API."""
        self.print_header("🤖 Google Gemini AI Setup")
        
        print("Google Gemini AI is used for generating automated match summaries.")
        print("This service is REQUIRED for full functionality.")
        
        if self.confirm_action("\nDo you want to set up Google Gemini AI?"):
            self.print_step("Step 1", "Opening Google AI Studio in your browser...")
            webbrowser.open("https://makersuite.google.com/app/apikey")
            
            print("\nFollow these steps:")
            print("1. Sign in with your Google account")
            print("2. Click 'Create API Key'")
            print("3. Select or create a project")
            print("4. Copy the generated API key")
            
            api_key = self.get_user_input("\nPaste your Google Gemini API key", sensitive=True)
            self.env_vars["GOOGLE_GEMINI_API_KEY"] = api_key
            print("✅ Google Gemini API configured!")
        else:
            print("⚠️ Skipping Google Gemini AI setup. Match summaries will be unavailable.")
            
    def setup_sendgrid(self):
        """Set up SendGrid email API."""
        self.print_header("📧 SendGrid Email Setup")
        
        print("SendGrid is used for sending email notifications to users.")
        print("This service is REQUIRED for user notifications.")
        
        if self.confirm_action("\nDo you want to set up SendGrid email?"):
            self.print_step("Step 1", "Opening SendGrid signup in your browser...")
            webbrowser.open("https://sendgrid.com/")
            
            print("\nFollow these steps:")
            print("1. Sign up for a free SendGrid account")
            print("2. Go to Settings → API Keys")
            print("3. Click 'Create API Key'")
            print("4. Choose 'Restricted Access' and enable Mail Send")
            print("5. Copy the generated API key")
            
            api_key = self.get_user_input("\nPaste your SendGrid API key", sensitive=True)
            self.env_vars["SENDGRID_API_KEY"] = api_key
            
            from_email = self.get_user_input("Enter the sender email address (e.g., noreply@yourdomain.com)")
            self.env_vars["FROM_EMAIL"] = from_email
            
            print("\n⚠️ IMPORTANT: Don't forget to verify your sender email in SendGrid!")
            print("   Go to Settings → Sender Authentication and verify your email.")
            
            print("✅ SendGrid email configured!")
        else:
            print("⚠️ Skipping SendGrid setup. Email notifications will be unavailable.")
            
    def setup_polygon_blockchain(self):
        """Set up Polygon blockchain integration."""
        self.print_header("⛓️ Polygon Blockchain Setup")
        
        print("Polygon blockchain is used for generating provably fair tournament draws.")
        print("This service is REQUIRED for blockchain-verified tournaments.")
        
        if self.confirm_action("\nDo you want to set up Polygon blockchain?"):
            print("\nChoose your Polygon RPC provider:")
            print("1. Free public RPC (may be rate limited)")
            print("2. Alchemy (recommended, has free tier)")
            print("3. Custom RPC URL")
            
            choice = self.get_user_input("Enter choice (1-3)", required=True)
            
            if choice == "1":
                rpc_url = "https://polygon-rpc.com/"
            elif choice == "2":
                self.print_step("Alchemy Setup", "Opening Alchemy in your browser...")
                webbrowser.open("https://www.alchemy.com/")
                print("1. Sign up for free account")
                print("2. Create new app → Select Polygon network")
                print("3. Copy the HTTPS URL")
                rpc_url = self.get_user_input("Paste your Alchemy HTTPS URL")
            else:
                rpc_url = self.get_user_input("Enter your custom RPC URL")
                
            self.env_vars["POLYGON_RPC_URL"] = rpc_url
            
            print("\n🔐 Wallet Setup:")
            print("You need a wallet private key for blockchain transactions.")
            print("⚠️ SECURITY: Create a new wallet specifically for this application!")
            print("⚠️ NEVER use your personal wallet private key!")
            
            if self.confirm_action("Do you have a dedicated wallet for this application?"):
                private_key = self.get_user_input("Enter wallet private key (without 0x prefix)", sensitive=True)
                self.env_vars["BLOCKCHAIN_PRIVATE_KEY"] = private_key
                
                print("\n💰 Funding your wallet:")
                print("Your wallet needs MATIC tokens for gas fees.")
                print("Send 0.1-1.0 MATIC to your wallet address for transactions.")
                print("You can get MATIC from exchanges like Coinbase, Binance, etc.")
            else:
                print("💡 Create a new wallet using MetaMask or similar:")
                print("1. Install MetaMask extension")
                print("2. Create new wallet")
                print("3. Export private key (Settings → Security → Export Private Key)")
                print("4. Add some MATIC tokens for gas fees")
                
            print("✅ Polygon blockchain configured!")
        else:
            print("⚠️ Skipping blockchain setup. Fair draws will use fallback method.")
            
    def setup_redis(self):
        """Set up Redis for caching and background tasks."""
        self.print_header("🗃️ Redis Setup")
        
        print("Redis is used for caching and background task processing.")
        print("This service is REQUIRED for optimal performance.")
        
        if self.confirm_action("\nDo you want to set up Redis?"):
            print("\nChoose your Redis setup:")
            print("1. Local Redis (recommended for development)")
            print("2. Cloud Redis (recommended for production)")
            
            choice = self.get_user_input("Enter choice (1-2)", required=True)
            
            if choice == "1":
                print("\n📋 Local Redis Installation:")
                print("Windows: Download from https://redis.io/docs/getting-started/installation/")
                print("Linux: sudo apt-get install redis-server")
                print("MacOS: brew install redis")
                print("\nAfter installation, start with: redis-server")
                
                redis_url = "redis://localhost:6379/0"
                print(f"Using default local Redis: {redis_url}")
            else:
                print("\n☁️ Cloud Redis Options:")
                print("1. Redis Cloud: https://redis.com/try-free/")
                print("2. Railway: https://railway.app/")
                print("3. Render: https://render.com/")
                
                redis_url = self.get_user_input("Enter your cloud Redis URL (redis://...)")
                
            self.env_vars["REDIS_URL"] = redis_url
            print("✅ Redis configured!")
        else:
            print("⚠️ Skipping Redis setup. Some features may be slower.")
            
    def setup_optional_apis(self):
        """Set up optional API integrations."""
        self.print_header("🌟 Optional API Integrations")
        
        print("These APIs are optional but can enhance your tournament platform:")
        
        # Discord Integration
        if self.confirm_action("\n🎮 Set up Discord integration for community features?"):
            self.print_step("Discord Setup", "Opening Discord Developer Portal...")
            webbrowser.open("https://discord.com/developers/applications")
            
            print("1. Create New Application")
            print("2. Go to Bot section → Create Bot")
            print("3. Copy Bot Token")
            
            token = self.get_user_input("Enter Discord Bot Token", required=False, sensitive=True)
            if token:
                self.env_vars["DISCORD_BOT_TOKEN"] = token
                
                webhook = self.get_user_input("Enter Discord Webhook URL (optional)", required=False)
                if webhook:
                    self.env_vars["DISCORD_WEBHOOK_URL"] = webhook
                    
        # Steam Integration
        if self.confirm_action("\n🎮 Set up Steam integration for player profiles?"):
            self.print_step("Steam Setup", "Opening Steam API registration...")
            webbrowser.open("https://steamcommunity.com/dev/apikey")
            
            print("1. Register your domain")
            print("2. Copy the API key")
            
            steam_key = self.get_user_input("Enter Steam API Key", required=False, sensitive=True)
            if steam_key:
                self.env_vars["STEAM_API_KEY"] = steam_key
                
        # Twitch Integration
        if self.confirm_action("\n🎥 Set up Twitch integration for streaming features?"):
            self.print_step("Twitch Setup", "Opening Twitch Developers...")
            webbrowser.open("https://dev.twitch.tv/console")
            
            print("1. Register application")
            print("2. Copy Client ID and Client Secret")
            
            client_id = self.get_user_input("Enter Twitch Client ID", required=False)
            if client_id:
                self.env_vars["TWITCH_CLIENT_ID"] = client_id
                
                client_secret = self.get_user_input("Enter Twitch Client Secret", required=False, sensitive=True)
                if client_secret:
                    self.env_vars["TWITCH_CLIENT_SECRET"] = client_secret
                    
    def save_env_file(self):
        """Save environment variables to .env file."""
        self.print_header("💾 Saving Configuration")
        
        if not self.env_vars:
            print("No configuration to save.")
            return
            
        env_file = ".env"
        backup_existing = False
        
        if os.path.exists(env_file):
            if self.confirm_action(f"{env_file} already exists. Create backup?"):
                import shutil
                shutil.copy(env_file, f"{env_file}.backup")
                print(f"✅ Backup created: {env_file}.backup")
                backup_existing = True
                
        # Read existing .env if it exists
        existing_vars = {}
        if os.path.exists(env_file):
            try:
                with open(env_file, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#') and '=' in line:
                            key, value = line.split('=', 1)
                            existing_vars[key] = value
            except Exception as e:
                print(f"Warning: Could not read existing .env file: {e}")
                
        # Merge with new variables
        existing_vars.update(self.env_vars)
        
        # Write updated .env file
        try:
            with open(env_file, 'w') as f:
                f.write("# =============================================================================\n")
                f.write("# AEGIS TOURNAMENT MANAGEMENT SYSTEM - CONFIGURATION\n")
                f.write(f"# Generated on: {os.popen('date').read().strip()}\n")
                f.write("# =============================================================================\n\n")
                
                # Required APIs
                f.write("# =============================================================================\n")
                f.write("# EXTERNAL API CONFIGURATIONS\n")
                f.write("# =============================================================================\n\n")
                
                for key, value in existing_vars.items():
                    f.write(f"{key}={value}\n")
                    
            print(f"✅ Configuration saved to {env_file}")
            
            # Show summary
            print(f"\n📊 Configured APIs:")
            for key, value in self.env_vars.items():
                masked_value = value[:8] + "..." if len(value) > 8 else value
                print(f"   ✅ {key}: {masked_value}")
                
        except Exception as e:
            print(f"❌ Error saving configuration: {e}")
            
    def run_setup(self):
        """Run the complete setup process."""
        self.print_header("🚀 Aegis Backend API Setup Assistant")
        
        print("Welcome to the Aegis Backend API Setup Assistant!")
        print("This will help you configure all external APIs step by step.")
        print("\n⚠️ Have your browser ready - we'll open several registration pages.")
        
        if not self.confirm_action("\nReady to start?"):
            print("Setup cancelled. Run again when ready!")
            return
            
        # Run setup steps
        try:
            self.setup_google_gemini()
            self.setup_sendgrid()
            self.setup_polygon_blockchain()
            self.setup_redis()
            self.setup_optional_apis()
            
            # Save configuration
            self.save_env_file()
            
            # Final instructions
            self.print_header("🎉 Setup Complete!")
            print("Your Aegis backend is now configured with external APIs!")
            
            print("\n📋 Next Steps:")
            print("1. Test your configuration: python test_external_apis.py")
            print("2. Start your backend: python -m uvicorn app.main:app --reload")
            print("3. Visit http://localhost:8000/docs to see the API documentation")
            
            print("\n💡 Remember to:")
            print("• Keep your API keys secure and never commit them to git")
            print("• Add your .env file to .gitignore")
            print("• Restart your backend server after configuration changes")
            
        except KeyboardInterrupt:
            print("\n🛑 Setup interrupted by user.")
        except Exception as e:
            print(f"\n💥 Setup error: {e}")


def main():
    """Main entry point."""
    try:
        assistant = APISetupAssistant()
        assistant.run_setup()
    except KeyboardInterrupt:
        print("\n👋 Setup cancelled by user. Goodbye!")
        sys.exit(0)
    except Exception as e:
        print(f"💥 Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()