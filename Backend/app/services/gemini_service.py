import google.generativeai as genai
import os
import json
from typing import Dict, Any, Optional


class GeminiService:
    """Service for AI-powered match summary generation using Google Gemini."""
    
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
        self.enabled = bool(self.api_key)
        
        if self.enabled:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-pro')
                print("Gemini AI service initialized successfully")
            except Exception as e:
                print(f"Failed to initialize Gemini service: {e}")
                self.enabled = False
        else:
            print("Gemini AI service disabled - missing API key")

    def generate_match_summary(self, match_data: Dict[str, Any]) -> str:
        """
        Generate an exciting narrative summary of a completed match.
        """
        if not self.enabled:
            return self._generate_fallback_summary(match_data)
        
        try:
            prompt = self._create_match_summary_prompt(match_data)
            
            response = self.model.generate_content(prompt)
            
            if response.text:
                return response.text.strip()
            else:
                return self._generate_fallback_summary(match_data)
                
        except Exception as e:
            print(f"Gemini API error: {e}")
            return self._generate_fallback_summary(match_data)

    def _create_match_summary_prompt(self, match_data: Dict[str, Any]) -> str:
        """Create a detailed prompt for match summary generation."""
        
        team1 = match_data.get("team1", "Team 1")
        team2 = match_data.get("team2", "Team 2")
        team1_score = match_data.get("team1_score", 0)
        team2_score = match_data.get("team2_score", 0)
        winner = match_data.get("winner", "No one")
        tournament = match_data.get("tournament", "Tournament")
        maps = match_data.get("maps", [])
        duration = match_data.get("duration", "Unknown duration")
        game_results = match_data.get("game_results", [])
        
        prompt = f"""
You are an expert esports commentator and writer. Create an exciting, professional match summary for the following esports match. 

Match Details:
- Tournament: {tournament}
- Teams: {team1} vs {team2}
- Final Score: {team1} {team1_score} - {team2_score} {team2}
- Winner: {winner}
- Duration: {duration}
"""
        
        if maps:
            prompt += f"- Maps Played: {', '.join(maps)}\n"
        
        if game_results:
            prompt += "\nGame-by-Game Results:\n"
            for game in game_results:
                game_num = game.get("game", "")
                map_name = game.get("map", "Unknown Map")
                g_team1_score = game.get("team1_score", 0)
                g_team2_score = game.get("team2_score", 0)
                g_winner = game.get("winner", "Draw")
                
                prompt += f"Game {game_num} ({map_name}): {team1} {g_team1_score} - {g_team2_score} {team2} (Winner: {g_winner})\n"
        
        prompt += f"""

Please write a compelling 2-3 paragraph match summary that:
1. Captures the excitement and key moments of the match
2. Highlights standout performances and turning points
3. Uses engaging esports language and terminology
4. Mentions specific games/maps if provided
5. Celebrates the winner while acknowledging both teams' efforts
6. Keeps it concise but exciting for fans to read

Style: Professional esports commentary, exciting but not over-the-top, suitable for sharing on social media or match reports.
"""
        
        return prompt

    def _generate_fallback_summary(self, match_data: Dict[str, Any]) -> str:
        """Generate a basic summary when AI is unavailable."""
        team1 = match_data.get("team1", "Team 1")
        team2 = match_data.get("team2", "Team 2")
        team1_score = match_data.get("team1_score", 0)
        team2_score = match_data.get("team2_score", 0)
        winner = match_data.get("winner", "No one")
        tournament = match_data.get("tournament", "Tournament")
        
        if winner == "Draw":
            summary = f"An intense match in {tournament} ended in a {team1_score}-{team2_score} draw between {team1} and {team2}. "
            summary += "Both teams showed incredible skill and determination throughout the match, "
            summary += "with neither side able to secure the decisive victory. A fantastic display of competitive gaming!"
        else:
            summary = f"{winner} emerged victorious in an exciting {tournament} match against "
            
            opponent = team2 if winner == team1 else team1
            summary += f"{opponent} with a final score of {team1_score}-{team2_score}. "
            
            if abs(team1_score - team2_score) <= 1:
                summary += "This nail-biting encounter kept fans on the edge of their seats, "
                summary += "with both teams trading blows throughout the series. "
            else:
                summary += f"{winner} dominated the match with a commanding performance, "
                summary += "showcasing their superior teamwork and strategy. "
            
            summary += f"Congratulations to {winner} on their well-deserved victory!"
        
        return summary

    def generate_tournament_recap(self, tournament_data: Dict[str, Any]) -> str:
        """Generate a tournament recap summary."""
        if not self.enabled:
            return self._generate_fallback_tournament_recap(tournament_data)
        
        try:
            prompt = self._create_tournament_recap_prompt(tournament_data)
            
            response = self.model.generate_content(prompt)
            
            if response.text:
                return response.text.strip()
            else:
                return self._generate_fallback_tournament_recap(tournament_data)
                
        except Exception as e:
            print(f"Gemini API error: {e}")
            return self._generate_fallback_tournament_recap(tournament_data)

    def _create_tournament_recap_prompt(self, tournament_data: Dict[str, Any]) -> str:
        """Create prompt for tournament recap generation."""
        tournament_name = tournament_data.get("name", "Tournament")
        winner = tournament_data.get("winner", "Unknown")
        total_teams = tournament_data.get("total_teams", 0)
        total_matches = tournament_data.get("total_matches", 0)
        format_type = tournament_data.get("format", "Unknown")
        game_title = tournament_data.get("game_title", "Game")
        
        prompt = f"""
You are an esports journalist writing a tournament recap. Create an engaging summary for the following tournament:

Tournament: {tournament_name}
Game: {game_title}
Format: {format_type}
Teams: {total_teams}
Total Matches: {total_matches}
Champion: {winner}
"""
        
        if "highlights" in tournament_data:
            prompt += f"\nKey Highlights:\n"
            for highlight in tournament_data["highlights"]:
                prompt += f"- {highlight}\n"
        
        prompt += """
Write a 2-3 paragraph tournament recap that:
1. Celebrates the tournament's success and the champion
2. Highlights key moments and standout performances
3. Thanks participants and organizers
4. Creates excitement for future tournaments
5. Uses professional esports language

Style: Celebratory and professional, suitable for official tournament announcements.
"""
        
        return prompt

    def _generate_fallback_tournament_recap(self, tournament_data: Dict[str, Any]) -> str:
        """Generate basic tournament recap when AI is unavailable."""
        tournament_name = tournament_data.get("name", "Tournament")
        winner = tournament_data.get("winner", "Unknown")
        total_teams = tournament_data.get("total_teams", 0)
        game_title = tournament_data.get("game_title", "Game")
        
        recap = f"The {tournament_name} has concluded with an incredible display of {game_title} talent! "
        recap += f"After intense competition between {total_teams} teams, {winner} has emerged as the champion. "
        recap += "Thank you to all participants for making this tournament a memorable experience. "
        recap += "Stay tuned for more exciting tournaments coming soon!"
        
        return recap

    def generate_player_profile(self, player_data: Dict[str, Any]) -> str:
        """Generate player profile description."""
        if not self.enabled:
            return self._generate_fallback_player_profile(player_data)
        
        try:
            player_name = player_data.get("name", "Player")
            team = player_data.get("team", "Team")
            role = player_data.get("role", "Player")
            achievements = player_data.get("achievements", [])
            
            prompt = f"""
Create a professional player profile for:
Name: {player_name}
Team: {team}
Role: {role}
Achievements: {', '.join(achievements) if achievements else 'Emerging talent'}

Write a compelling 1-2 paragraph profile highlighting their skills, achievements, and potential.
"""
            
            response = self.model.generate_content(prompt)
            
            if response.text:
                return response.text.strip()
            else:
                return self._generate_fallback_player_profile(player_data)
                
        except Exception as e:
            print(f"Gemini API error: {e}")
            return self._generate_fallback_player_profile(player_data)

    def _generate_fallback_player_profile(self, player_data: Dict[str, Any]) -> str:
        """Generate basic player profile when AI is unavailable."""
        player_name = player_data.get("name", "Player")
        team = player_data.get("team", "Team")
        role = player_data.get("role", "Player")
        
        profile = f"{player_name} is a dedicated {role} for {team}, "
        profile += "known for their skill, teamwork, and competitive spirit. "
        profile += "A valuable asset to their team and the esports community."
        
        return profile

    def analyze_match_statistics(self, stats_data: Dict[str, Any]) -> str:
        """Generate analysis of match statistics."""
        if not self.enabled:
            return "Statistical analysis unavailable."
        
        try:
            prompt = f"""
Analyze the following match statistics and provide insights:

Statistics: {json.dumps(stats_data, indent=2)}

Provide a brief analysis highlighting key performance indicators, 
standout statistics, and what they tell us about the teams' performance.
Keep it under 150 words and focus on the most significant findings.
"""
            
            response = self.model.generate_content(prompt)
            
            if response.text:
                return response.text.strip()
            else:
                return "Statistical analysis unavailable."
                
        except Exception as e:
            print(f"Gemini API error: {e}")
            return "Statistical analysis unavailable."

    def is_enabled(self) -> bool:
        """Check if Gemini service is available."""
        return self.enabled

    def get_service_status(self) -> Dict[str, Any]:
        """Get service status information."""
        return {
            "enabled": self.enabled,
            "model": "gemini-pro" if self.enabled else None,
            "api_configured": bool(self.api_key)
        }