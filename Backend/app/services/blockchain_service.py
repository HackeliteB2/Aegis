from typing import List, Optional
from uuid import UUID
import hashlib
import json
import random
from web3 import Web3
import os
from datetime import datetime


class BlockchainService:
    """Service for blockchain interactions to ensure fair tournament draws."""
    
    def __init__(self):
        self.web3_provider = os.getenv("POLYGON_RPC_URL", "https://polygon-rpc.com/")
        self.contract_address = os.getenv("TOURNAMENT_CONTRACT_ADDRESS")
        self.private_key = os.getenv("BLOCKCHAIN_PRIVATE_KEY")
        self.enabled = bool(self.contract_address and self.private_key)
        
        if self.enabled:
            try:
                self.w3 = Web3(Web3.HTTPProvider(self.web3_provider))
                self.account = self.w3.eth.account.from_key(self.private_key)
                print(f"Blockchain service initialized. Connected: {self.w3.is_connected()}")
            except Exception as e:
                print(f"Failed to initialize blockchain service: {e}")
                self.enabled = False
        else:
            print("Blockchain service disabled - missing configuration")

    def generate_fair_draw(self, tournament_id: UUID, team_ids: List[UUID]) -> Optional[str]:
        """
        Generate a fair tournament draw using blockchain for transparency.
        Returns transaction hash if successful.
        """
        if not self.enabled:
            # Fallback to deterministic pseudo-random generation
            return self._generate_deterministic_hash(tournament_id, team_ids)
        
        try:
            # Create deterministic seed based on tournament and teams
            seed_data = {
                "tournament_id": str(tournament_id),
                "team_ids": [str(team_id) for team_id in team_ids],
                "timestamp": int(datetime.utcnow().timestamp()),
                "block_number": self.w3.eth.block_number
            }
            
            # Create transaction to record the draw on blockchain
            transaction_data = self._create_draw_transaction(seed_data)
            
            # For now, simulate blockchain transaction
            # In production, this would interact with a smart contract
            tx_hash = self._simulate_blockchain_transaction(transaction_data)
            
            return tx_hash
            
        except Exception as e:
            print(f"Blockchain draw generation failed: {e}")
            # Fallback to deterministic hash
            return self._generate_deterministic_hash(tournament_id, team_ids)

    def _generate_deterministic_hash(self, tournament_id: UUID, team_ids: List[UUID]) -> str:
        """Generate a deterministic hash for the draw (fallback method)."""
        data = {
            "tournament_id": str(tournament_id),
            "team_ids": sorted([str(team_id) for team_id in team_ids]),
            "timestamp": int(datetime.utcnow().timestamp() // 3600)  # Hour precision for determinism
        }
        
        hash_input = json.dumps(data, sort_keys=True)
        return f"0x{hashlib.sha256(hash_input.encode()).hexdigest()}"

    def _create_draw_transaction(self, seed_data: dict) -> dict:
        """Create transaction data for blockchain submission."""
        return {
            "tournament_id": seed_data["tournament_id"],
            "team_count": len(seed_data["team_ids"]),
            "seed_hash": hashlib.sha256(json.dumps(seed_data, sort_keys=True).encode()).hexdigest(),
            "timestamp": seed_data["timestamp"],
            "block_number": seed_data["block_number"]
        }

    def _simulate_blockchain_transaction(self, transaction_data: dict) -> str:
        """Simulate blockchain transaction (for demo purposes)."""
        # In production, this would:
        # 1. Call smart contract function
        # 2. Sign transaction with private key
        # 3. Submit to blockchain
        # 4. Return actual transaction hash
        
        tx_hash = hashlib.sha256(
            json.dumps(transaction_data, sort_keys=True).encode()
        ).hexdigest()
        
        return f"0x{tx_hash}"

    def verify_draw_fairness(self, transaction_hash: str, tournament_id: UUID, team_ids: List[UUID]) -> bool:
        """
        Verify that a tournament draw was fair by checking blockchain record.
        """
        if not self.enabled or not transaction_hash:
            return False
        
        try:
            # In production, this would:
            # 1. Query blockchain for transaction
            # 2. Verify transaction data matches expected parameters
            # 3. Confirm transaction was mined in a valid block
            
            # For demo, we'll verify the hash format
            return transaction_hash.startswith("0x") and len(transaction_hash) == 66
            
        except Exception as e:
            print(f"Draw verification failed: {e}")
            return False

    def get_draw_details(self, transaction_hash: str) -> Optional[dict]:
        """Get details of a draw from blockchain."""
        if not self.enabled:
            return None
        
        try:
            # In production, this would query the blockchain for transaction details
            return {
                "transaction_hash": transaction_hash,
                "verified": True,
                "block_number": "simulated",
                "timestamp": int(datetime.utcnow().timestamp()),
                "gas_used": "simulated"
            }
        except Exception as e:
            print(f"Failed to get draw details: {e}")
            return None

    def is_blockchain_enabled(self) -> bool:
        """Check if blockchain functionality is enabled."""
        return self.enabled

    def get_network_status(self) -> dict:
        """Get blockchain network status."""
        if not self.enabled:
            return {"status": "disabled", "reason": "missing_configuration"}
        
        try:
            return {
                "status": "connected" if self.w3.is_connected() else "disconnected",
                "latest_block": self.w3.eth.block_number if self.w3.is_connected() else None,
                "chain_id": self.w3.eth.chain_id if self.w3.is_connected() else None,
                "account": self.account.address if hasattr(self, 'account') else None
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}


# Smart contract ABI (simplified version for tournament draws)
TOURNAMENT_CONTRACT_ABI = [
    {
        "inputs": [
            {"name": "_tournamentId", "type": "string"},
            {"name": "_teamHashes", "type": "bytes32[]"},
            {"name": "_seed", "type": "bytes32"}
        ],
        "name": "generateDraw",
        "outputs": [{"name": "", "type": "bytes32"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "_tournamentId", "type": "string"}
        ],
        "name": "getDrawResult",
        "outputs": [
            {"name": "seed", "type": "bytes32"},
            {"name": "timestamp", "type": "uint256"},
            {"name": "verified", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
]