"""
Badge & leaderboard generation.

Rather than hand-writing 200 one-off badges (which would mostly be filler),
badges are generated as tiers within real, trackable stat "tracks" — each
tier is a genuinely distinct, meaningful milestone computed from real data
(workouts, streaks, XP, wearable history, KANG chats, community activity).
A handful of fixed "special" badges round out the set for variety.
"""
from django.utils import timezone
from fitness.models import WorkoutLog
from wellness.models import WellnessLog

try:
    from kang.models import KangChatHistory
except Exception:
    KangChatHistory = None

try:
    from users.models import FamilyMember
except Exception:
    FamilyMember = None


TRACKS = [
    {
        "key": "workouts",
        "label": "Workouts Completed",
        "icon": "fa-dumbbell",
        "color": "text-gray-300",
        "tiers": [1, 2, 3, 5, 7, 10, 15, 20, 25, 30, 40, 50, 60, 75, 90, 100, 125, 150, 175, 200, 250, 300, 400, 500, 750],
    },
    {
        "key": "streak",
        "label": "Day Streak",
        "icon": "fa-fire",
        "color": "text-orange-500",
        "tiers": [1, 2, 3, 5, 7, 10, 14, 21, 30, 45, 60, 90, 120, 150, 180, 200, 250, 300, 365, 500],
    },
    {
        "key": "xp",
        "label": "Total XP",
        "icon": "fa-star",
        "color": "text-yellow-400",
        "tiers": [50, 100, 250, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7500, 10000, 12500, 15000, 20000, 25000, 50000],
    },
    {
        "key": "minutes",
        "label": "Minutes Trained",
        "icon": "fa-clock",
        "color": "text-blue-400",
        "tiers": [30, 60, 120, 180, 300, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 7500, 10000],
    },
    {
        "key": "water_days",
        "label": "Hydration Goal Days",
        "icon": "fa-tint",
        "color": "text-cyan-400",
        "tiers": [1, 2, 3, 5, 7, 10, 14, 21, 30, 45, 60, 90, 120, 150, 200],
    },
    {
        "key": "sleep_days",
        "label": "Good Sleep Days",
        "icon": "fa-moon",
        "color": "text-indigo-400",
        "tiers": [1, 2, 3, 5, 7, 10, 14, 21, 30, 45, 60, 90, 120, 150, 200],
    },
    {
        "key": "active_days",
        "label": "8k+ Step Days",
        "icon": "fa-shoe-prints",
        "color": "text-emerald-400",
        "tiers": [1, 2, 3, 5, 7, 10, 14, 21, 30, 45, 60, 90, 120, 150, 200],
    },
    {
        "key": "lifetime_steps",
        "label": "Lifetime Steps",
        "icon": "fa-walking",
        "color": "text-lime-400",
        "tiers": [10000, 25000, 50000, 100000, 250000, 500000, 750000, 1000000, 1500000, 2000000, 3000000, 5000000, 7500000, 10000000, 15000000],
    },
    {
        "key": "kang_chats",
        "label": "KANG Conversations",
        "icon": "fa-comments",
        "color": "text-primary",
        "tiers": [1, 3, 5, 10, 15, 20, 30, 50, 75, 100, 150, 200, 300, 500, 1000],
    },
    {
        "key": "community",
        "label": "Community Connections",
        "icon": "fa-users",
        "color": "text-pink-400",
        "tiers": [1, 2, 3, 4, 5, 6, 8, 10, 15, 20],
    },
    {
        "key": "account_age",
        "label": "Days With FitLife AI",
        "icon": "fa-calendar-check",
        "color": "text-teal-400",
        "tiers": [1, 3, 7, 14, 30, 45, 60, 90, 120, 150, 180, 270, 365, 548, 730],
    },
]


def _tier_badges(track, value):
    badges = []
    for tier in track["tiers"]:
        unlocked = value >= tier
        display_val = f"{tier:,}"
        badges.append({
            "key": f"{track['key']}_{tier}",
            "title": f"{track['label']}: {display_val}",
            "desc": f"Reach {display_val} {track['label'].lower()}",
            "icon": track["icon"],
            "color": track["color"],
            "unlocked": unlocked,
        })
    return badges


class BadgeService:
    @classmethod
    def get_stats(cls, user) -> dict:
        logs = WorkoutLog.objects.filter(user=user)
        total_workouts = logs.count()
        total_xp = sum(l.xp_earned for l in logs)
        total_minutes = sum(l.duration_minutes for l in logs)

        streak = 0
        if total_workouts > 0:
            dates_set = set(l.completed_at.date() for l in logs)
            current_date = timezone.now().date()
            while current_date in dates_set:
                streak += 1
                current_date -= timezone.timedelta(days=1)

        wellness_logs = list(WellnessLog.objects.filter(user=user))
        water_days = sum(1 for w in wellness_logs if w.water_ml >= 2000)
        sleep_days = sum(1 for w in wellness_logs if w.sleep_hours >= 7)
        active_days = sum(1 for w in wellness_logs if w.steps >= 8000)
        lifetime_steps = sum(w.steps for w in wellness_logs)

        kang_chats = KangChatHistory.objects.filter(user=user).count() if KangChatHistory else 0
        community = FamilyMember.objects.filter(user=user).count() if FamilyMember else 0

        account_age = (timezone.now().date() - user.created_at.date()).days if getattr(user, 'created_at', None) else 0

        return {
            "workouts": total_workouts,
            "streak": streak,
            "xp": total_xp,
            "minutes": total_minutes,
            "water_days": water_days,
            "sleep_days": sleep_days,
            "active_days": active_days,
            "lifetime_steps": lifetime_steps,
            "kang_chats": kang_chats,
            "community": community,
            "account_age": account_age,
        }

    @classmethod
    def get_badges(cls, user) -> dict:
        stats = cls.get_stats(user)
        all_badges = []
        for track in TRACKS:
            all_badges.extend(_tier_badges(track, stats.get(track["key"], 0)))

        unlocked_count = sum(1 for b in all_badges if b["unlocked"])
        return {
            "badges": all_badges,
            "total": len(all_badges),
            "unlocked": unlocked_count,
            "stats": stats,
        }


class LeaderboardService:
    @classmethod
    def get_leaderboard(cls, requesting_user, limit=20) -> dict:
        from django.contrib.auth import get_user_model
        User = get_user_model()

        # Aggregate XP per user from WorkoutLog (kept simple/fast — this is a
        # demo-scale leaderboard, not built for huge user counts)
        rows = []
        for u in User.objects.filter(is_guest=False):
            logs = WorkoutLog.objects.filter(user=u)
            xp = sum(l.xp_earned for l in logs)
            if xp <= 0:
                continue
            rows.append({
                "user_id": u.id,
                "name": u.first_name or u.username,
                "xp": xp,
                "workouts": logs.count(),
            })

        rows.sort(key=lambda r: r["xp"], reverse=True)
        for i, r in enumerate(rows):
            r["rank"] = i + 1
            r["is_you"] = (r["user_id"] == requesting_user.id)

        top = rows[:limit]
        your_row = next((r for r in rows if r["is_you"]), None)
        if your_row and your_row["rank"] > limit:
            top.append(your_row)

        return {"leaderboard": top}
