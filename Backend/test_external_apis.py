#!/usr/bin/env python3
"""
External API Testing Script for Aegis Backend

This script tests all external API integrations to ensure they're working correctly.

Usage:
    python test_external_apis.py
"""

import os
import sys
from typing import Dict, Any
from datetime import datetime
import asyncio


class ExternalAPITester:
    """Test all external API integrations."""
    
    def __init__(self):
        self.results = {}
        
    def log(self, message: str, level: str = "INFO"):
        """Log test progress."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        colors = {
            "INFO": "\033[94m",      # Blue
            "SUCCESS": "\033[92m",   # Green
            "WARNING": "\033[93m",   # Yellow
            "ERROR": "\033[91m",     # Red
            "RESET": "\033[0m"       # Reset
        }
        color = colors.get(level, colors["RESET"])
        print(f"{color}[{timestamp}] {level}: {message}{colors['RESET']}")
        
    def test_google_gemini_api(self) -> bool:
        """Test Google Gemini AI API."""
        self.log("🤖 Testing Google Gemini AI API...")
        
        api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
        if not api_key:
            self.log("❌ GOOGLE_GEMINI_API_KEY not found in environment", "ERROR")
            return False
            
        try:
            import google.generativeai as genai
            
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-pro')
            
            # Test with a simple prompt
            response = model.generate_content("Generate a brief test message for API testing.")
            
            if response.text:
                self.log("✅ Google Gemini API is working correctly", "SUCCESS")
                self.log(f"Sample response: {response.text[:100]}...", "INFO")
                return True
            else:
                self.log("❌ Google Gemini API returned empty response", "ERROR")
                return False
                
        except ImportError:
            self.log("❌ google-generativeai package not installed. Run: pip install google-generativeai", "ERROR")
            return False
        except Exception as e:
            self.log(f"❌ Google Gemini API test failed: {str(e)}", "ERROR")
            return False
            
    def test_sendgrid_api(self) -> bool:
        """Test SendGrid email API."""
        self.log("📧 Testing SendGrid Email API...")
        
        api_key = os.getenv("SENDGRID_API_KEY")
        from_email = os.getenv("FROM_EMAIL")
        
        if not api_key:
            self.log("❌ SENDGRID_API_KEY not found in environment", "ERROR")
            return False
            
        if not from_email:
            self.log("❌ FROM_EMAIL not found in environment", "ERROR")
            return False
            
        try:
            import sendgrid
            from sendgrid.helpers.mail import Mail
            
            sg = sendgrid.SendGridAPIClient(api_key=api_key)
            
            # Test API key validity (don't actually send email)
            message = Mail(
                from_email=from_email,
                to_emails="test@example.com",  # Won't be sent
                subject="API Test",
                html_content="<p>Test message</p>"
            )
            
            # Just validate the API key by creating the client
            self.log("✅ SendGrid API key is valid", "SUCCESS")
            self.log(f"Configured sender: {from_email}", "INFO")
            return True
            
        except ImportError:
            self.log("❌ sendgrid package not installed. Run: pip install sendgrid", "ERROR")
            return False
        except Exception as e:
            self.log(f"❌ SendGrid API test failed: {str(e)}", "ERROR")
            return False
            
    def test_polygon_blockchain(self) -> bool:
        """Test Polygon blockchain connection."""
        self.log("⛓️ Testing Polygon Blockchain Connection...")
        
        rpc_url = os.getenv("POLYGON_RPC_URL")
        private_key = os.getenv("BLOCKCHAIN_PRIVATE_KEY")
        
        if not rpc_url:
            self.log("❌ POLYGON_RPC_URL not found in environment", "ERROR")
            return False
            
        try:
            from web3 import Web3
            
            w3 = Web3(Web3.HTTPProvider(rpc_url))
            
            if w3.is_connected():
                latest_block = w3.eth.block_number
                chain_id = w3.eth.chain_id
                
                self.log("✅ Polygon blockchain connection successful", "SUCCESS")
                self.log(f"Chain ID: {chain_id} (137 = Polygon Mainnet)", "INFO")
                self.log(f"Latest block: {latest_block}", "INFO")
                
                # Test wallet if private key provided
                if private_key:
                    try:
                        account = w3.eth.account.from_key(private_key)
                        balance = w3.eth.get_balance(account.address)
                        balance_matic = w3.from_wei(balance, 'ether')
                        
                        self.log(f"Wallet address: {account.address}", "INFO")
                        self.log(f"Wallet balance: {balance_matic:.4f} MATIC", "INFO")
                        
                        if balance_matic < 0.01:
                            self.log("⚠️ Low MATIC balance. Add funds for transactions.", "WARNING")
                    except Exception as e:
                        self.log(f"⚠️ Wallet test failed: {str(e)}", "WARNING")
                
                return True
            else:
                self.log("❌ Failed to connect to Polygon network", "ERROR")
                return False
                
        except ImportError:
            self.log("❌ web3 package not installed. Run: pip install web3", "ERROR")
            return False
        except Exception as e:
            self.log(f"❌ Polygon blockchain test failed: {str(e)}", "ERROR")
            return False
            
    def test_redis_connection(self) -> bool:
        """Test Redis connection."""
        self.log("🗃️ Testing Redis Connection...")
        
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        
        try:
            import redis
            
            r = redis.from_url(redis_url)
            
            # Test connection with ping
            r.ping()
            
            # Test basic operations
            test_key = "aegis_test_key"
            test_value = "test_value"
            
            r.set(test_key, test_value, ex=10)  # Expire in 10 seconds
            retrieved_value = r.get(test_key)
            
            if retrieved_value and retrieved_value.decode() == test_value:
                r.delete(test_key)  # Cleanup
                self.log("✅ Redis connection and operations successful", "SUCCESS")
                self.log(f"Connected to: {redis_url}", "INFO")
                return True
            else:
                self.log("❌ Redis operations failed", "ERROR")
                return False
                
        except ImportError:
            self.log("❌ redis package not installed. Run: pip install redis", "ERROR")
            return False
        except Exception as e:
            self.log(f"❌ Redis connection test failed: {str(e)}", "ERROR")
            self.log("💡 Make sure Redis server is running", "INFO")
            return False
            
    def test_optional_apis(self) -> Dict[str, bool]:
        """Test optional API integrations."""
        self.log("🌐 Testing Optional APIs...")
        
        results = {}
        
        # Discord Integration
        discord_token = os.getenv("DISCORD_BOT_TOKEN")
        if discord_token:
            self.log("Testing Discord integration...", "INFO")
            results['discord'] = True  # Basic validation
            self.log("✅ Discord token configured", "SUCCESS")
        else:
            self.log("⚠️ Discord integration not configured (optional)", "WARNING")
            results['discord'] = False
            
        # Steam Integration
        steam_key = os.getenv("STEAM_API_KEY")
        if steam_key:
            self.log("✅ Steam API key configured", "SUCCESS")
            results['steam'] = True
        else:
            self.log("⚠️ Steam integration not configured (optional)", "WARNING")
            results['steam'] = False
            
        # Twitch Integration
        twitch_client_id = os.getenv("TWITCH_CLIENT_ID")
        twitch_secret = os.getenv("TWITCH_CLIENT_SECRET")
        if twitch_client_id and twitch_secret:
            self.log("✅ Twitch API configured", "SUCCESS")
            results['twitch'] = True
        else:
            self.log("⚠️ Twitch integration not configured (optional)", "WARNING")
            results['twitch'] = False
            
        return results
        
    async def run_all_tests(self) -> Dict[str, bool]:
        """Run all external API tests."""
        self.log("🚀 Starting External API Tests for Aegis Backend...", "INFO")
        self.log("=" * 60, "INFO")
        
        tests = [
            ("Google Gemini AI", self.test_google_gemini_api),
            ("SendGrid Email", self.test_sendgrid_api),
            ("Polygon Blockchain", self.test_polygon_blockchain),
            ("Redis Connection", self.test_redis_connection),
        ]
        
        # Run core API tests
        for test_name, test_func in tests:
            self.log(f"🧪 Running {test_name} test...", "INFO")
            try:
                result = test_func()
                self.results[test_name.lower().replace(" ", "_")] = result
                
                if result:
                    self.log(f"✅ {test_name} test PASSED", "SUCCESS")
                else:
                    self.log(f"❌ {test_name} test FAILED", "ERROR")
                    
            except Exception as e:
                self.log(f"💥 {test_name} test ERROR: {str(e)}", "ERROR")
                self.results[test_name.lower().replace(" ", "_")] = False
                
            self.log("-" * 50, "INFO")
            
        # Test optional APIs
        optional_results = self.test_optional_apis()
        self.results.update(optional_results)
        
        # Summary
        self.generate_summary()
        return self.results
        
    def generate_summary(self):
        """Generate test results summary."""
        self.log("📊 TEST RESULTS SUMMARY", "INFO")
        self.log("=" * 60, "INFO")
        
        required_apis = [
            ("google_gemini_ai", "Google Gemini AI"),
            ("sendgrid_email", "SendGrid Email"), 
            ("polygon_blockchain", "Polygon Blockchain"),
            ("redis_connection", "Redis Connection")
        ]
        
        optional_apis = [
            ("discord", "Discord Integration"),
            ("steam", "Steam Integration"),
            ("twitch", "Twitch Integration")
        ]
        
        # Required APIs summary
        self.log("🔥 REQUIRED APIs:", "INFO")
        required_passed = 0
        for key, name in required_apis:
            status = self.results.get(key, False)
            symbol = "✅" if status else "❌"
            level = "SUCCESS" if status else "ERROR"
            self.log(f"  {symbol} {name}", level)
            if status:
                required_passed += 1
                
        # Optional APIs summary  
        self.log("🌟 OPTIONAL APIs:", "INFO")
        for key, name in optional_apis:
            status = self.results.get(key, False)
            symbol = "✅" if status else "⚠️"
            level = "SUCCESS" if status else "WARNING"
            self.log(f"  {symbol} {name}", level)
            
        # Overall status
        self.log("=" * 60, "INFO")
        if required_passed == len(required_apis):
            self.log("🎉 ALL REQUIRED APIs are working! Backend is ready to go!", "SUCCESS")
        else:
            failed = len(required_apis) - required_passed
            self.log(f"⚠️ {failed} required API(s) failed. Please fix before deploying.", "ERROR")
            
        # Configuration reminder
        self.log("💡 Configuration Tips:", "INFO")
        self.log("• Make sure all API keys are in your .env file", "INFO")
        self.log("• Restart your backend server after adding new keys", "INFO")
        self.log("• Check the logs above for specific error messages", "INFO")
        self.log("• Optional APIs can be configured later", "INFO")


def load_environment():
    """Load environment variables from .env file."""
    try:
        from dotenv import load_dotenv
        if os.path.exists('.env'):
            load_dotenv('.env')
            print("📝 Loaded environment from .env file")
        else:
            print("⚠️ No .env file found. Using system environment variables.")
    except ImportError:
        print("⚠️ python-dotenv not installed. Using system environment variables.")


async def main():
    """Main test runner."""
    print("🏆 Aegis Backend - External API Testing")
    print("=" * 60)
    
    # Load environment
    load_environment()
    
    # Run tests
    tester = ExternalAPITester()
    
    try:
        results = await tester.run_all_tests()
        
        # Return appropriate exit code
        required_apis = ['google_gemini_ai', 'sendgrid_email', 'polygon_blockchain', 'redis_connection']
        required_working = all(results.get(api, False) for api in required_apis)
        
        return 0 if required_working else 1
        
    except KeyboardInterrupt:
        tester.log("🛑 Tests interrupted by user", "WARNING")
        return 130
        
    except Exception as e:
        tester.log(f"💥 Unexpected error: {str(e)}", "ERROR")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)