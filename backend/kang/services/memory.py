class KangMemoryService:
    # ఇన్-మెమరీ డిక్షనరీ ద్వారా యూజర్ చాట్ హిస్టరీని తాత్కాలికంగా స్టోర్ చేయడానికి
    _memory_store = {}

    @classmethod
    def get_history(cls, user_id):
        """యూజర్ ఐడీ ఆధారంగా గత చాట్ హిస్టరీని రిటర్న్ చేస్తుంది"""
        if user_id not in cls._memory_store:
            cls._memory_store[user_id] = []
        return cls._memory_store[user_id]

    @classmethod
    def add_message(cls, user_id, role, content):
        """చాట్ మెసేజెస్‌ని హిస్టరీలో యాడ్ చేస్తుంది"""
        if user_id not in cls._memory_store:
            cls._memory_store[user_id] = []
        
        # కంటెంట్ సేఫ్టీ లేదా స్టాండర్డ్ ఫార్మాట్ కోసం
        cls._memory_store[user_id].append({
            "role": role, # 'user' లేదా 'assistant'
            "content": content
        })

        # హిస్టరీ మరీ ఎక్కువ కాకుండా కేవలం చివరి 10 మెసేజెస్‌ని మాత్రమే ఉంచుతుంది (మెమరీ ఆప్టిమైజేషన్)
        if len(cls._memory_store[user_id]) > 10:
            cls._memory_store[user_id] = cls._memory_store[user_id][-10:]

    @classmethod
    def clear_history(cls, user_id):
        """చాట్ హిస్టరీని క్లియర్ చేయడానికి"""
        if user_id in cls._memory_store:
            cls._memory_store[user_id] = []