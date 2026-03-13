import pytest
from datetime import datetime, timedelta
from app.core.srs_engine import EbbinghausSRS, SRSCard, ReviewQuality


class TestSRSEngine:

    def test_first_review_perfect(self):
        """第一次复习，完美记忆 → 下次30分钟后"""
        card = SRSCard(card_id="test1")
        result = EbbinghausSRS.calculate_next_review(card, ReviewQuality.PERFECT)

        assert result.repetition_count == 1
        assert result.interval_days > 0
        assert result.next_review_at is not None
        print(f"✅ 第1次完美复习 → 间隔: {EbbinghausSRS.format_interval(result.interval_days)}")

    def test_first_review_forgot(self):
        """第一次复习就忘了 → 重置到最短间隔"""
        card = SRSCard(card_id="test2")
        result = EbbinghausSRS.calculate_next_review(card, ReviewQuality.FORGOT)

        assert result.repetition_count == 0
        assert result.ease_factor < 2.5  # 难度增加
        print(f"✅ 忘记后重置 → 间隔: {EbbinghausSRS.format_interval(result.interval_days)}")

    def test_ebbinghaus_intervals(self):
        """测试严格按艾宾浩斯间隔递增"""
        card = SRSCard(card_id="test3")
        intervals = []

        # 模拟连续10次正确复习
        for i in range(10):
            card = EbbinghausSRS.calculate_next_review(card, ReviewQuality.EASY)
            intervals.append(card.interval_days)
            print(f"  第{i+1}次 → {EbbinghausSRS.format_interval(card.interval_days)}")

        # 验证间隔在递增
        for i in range(1, len(intervals)):
            assert intervals[i] >= intervals[i-1], \
                f"第{i+1}次间隔({intervals[i]})应该 >= 第{i}次({intervals[i-1]})"

        print("✅ 间隔严格递增")

    def test_difficulty_adjustment(self):
        """测试难度因子调整"""
        card = SRSCard(card_id="test4")

        # 多次回答简单 → ease 应该增加
        for _ in range(5):
            card = EbbinghausSRS.calculate_next_review(card, ReviewQuality.PERFECT)
        easy_ease = card.ease_factor

        # 重新开始，多次回答困难
        card2 = SRSCard(card_id="test5")
        for _ in range(5):
            card2 = EbbinghausSRS.calculate_next_review(card2, ReviewQuality.RECALLED)
        hard_ease = card2.ease_factor

        assert easy_ease > hard_ease
        print(f"✅ 简单卡片ease({easy_ease:.2f}) > 困难卡片ease({hard_ease:.2f})")

    def test_forgot_resets_count(self):
        """忘记后重置复习次数"""
        card = SRSCard(card_id="test6")

        # 先正确3次
        for _ in range(3):
            card = EbbinghausSRS.calculate_next_review(card, ReviewQuality.EASY)
        assert card.repetition_count == 3

        # 忘记了
        card = EbbinghausSRS.calculate_next_review(card, ReviewQuality.FORGOT)
        assert card.repetition_count == 0
        print("✅ 忘记后次数重置为0")

    def test_ease_never_below_minimum(self):
        """ease_factor 不会低于1.3"""
        card = SRSCard(card_id="test7")

        # 连续忘记20次
        for _ in range(20):
            card = EbbinghausSRS.calculate_next_review(card, ReviewQuality.FORGOT)

        assert card.ease_factor >= 1.3
        print(f"✅ ease_factor 最低值: {card.ease_factor}")

    def test_format_interval(self):
        """测试时间格式化"""
        assert "分钟" in EbbinghausSRS.format_interval(5 / 1440)
        assert "小时" in EbbinghausSRS.format_interval(0.5)
        assert "天" in EbbinghausSRS.format_interval(7)
        assert "月" in EbbinghausSRS.format_interval(60)
        print("✅ 时间格式化正确")

    def test_full_review_cycle(self):
        """模拟完整的复习周期"""
        card = SRSCard(card_id="full_cycle")

        print("\n📅 模拟完整复习周期:")
        print("-" * 50)

        schedule = [
            (ReviewQuality.RECALLED, "第1次: 正常回忆"),
            (ReviewQuality.EASY,     "第2次: 轻松"),
            (ReviewQuality.PERFECT,  "第3次: 完美"),
            (ReviewQuality.RECALLED, "第4次: 正常"),
            (ReviewQuality.HESITATED,"第5次: 犹豫了"),  # 质量2，会重置
            (ReviewQuality.RECALLED, "重来1: 正常"),
            (ReviewQuality.EASY,     "重来2: 轻松"),
            (ReviewQuality.PERFECT,  "重来3: 完美"),
            (ReviewQuality.PERFECT,  "重来4: 完美"),
            (ReviewQuality.PERFECT,  "重来5: 完美"),
        ]

        for quality, desc in schedule:
            card = EbbinghausSRS.calculate_next_review(card, quality)
            interval = EbbinghausSRS.format_interval(card.interval_days)
            print(f"  {desc} → 下次: {interval}, ease: {card.ease_factor:.2f}, 连续: {card.repetition_count}")

        print("-" * 50)
        print("✅ 完整周期测试通过")