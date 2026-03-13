import pytest
import httpx
import asyncio

BASE_URL = "http://localhost:8000/api/v1"

# 存储测试过程中的数据
test_data = {
    "token": None,
    "user_id": None,
    "deck_id": None,
    "card_id": None,
}


class TestRecallAPI:
    """按顺序测试所有 API"""

    # ===== 认证测试 =====

    def test_01_register(self):
        """测试注册"""
        with httpx.Client() as client:
            res = client.post(f"{BASE_URL}/auth/register", json={
                "email": "pytest@test.com",
                "username": "测试用户",
                "password": "test123456",
            })

            # 如果用户已存在，也算通过
            assert res.status_code in [200, 400]

            if res.status_code == 200:
                data = res.json()
                assert "id" in data
                assert data["email"] == "pytest@test.com"
                test_data["user_id"] = data["id"]
                print(f"✅ 注册成功: {data['id']}")
            else:
                print("⚠️ 用户已存在，跳过注册")

    def test_02_login(self):
        """测试登录"""
        with httpx.Client() as client:
            res = client.post(f"{BASE_URL}/auth/login", json={
                "email": "pytest@test.com",
                "password": "test123456",
            })

            assert res.status_code == 200
            data = res.json()
            assert "access_token" in data
            test_data["token"] = data["access_token"]
            print(f"✅ 登录成功，获得 token")

    def test_03_login_wrong_password(self):
        """测试错误密码"""
        with httpx.Client() as client:
            res = client.post(f"{BASE_URL}/auth/login", json={
                "email": "pytest@test.com",
                "password": "wrongpassword",
            })
            assert res.status_code == 401
            print("✅ 错误密码被正确拒绝")

    # ===== 卡片组测试 =====

    def _headers(self):
        return {"Authorization": f"Bearer {test_data['token']}"}

    def test_04_create_deck(self):
        """测试创建卡片组"""
        with httpx.Client() as client:
            res = client.post(f"{BASE_URL}/decks/", json={
                "name": "Python测试组",
                "description": "自动测试创建的卡片组",
                "color": "#4CAF50",
            }, headers=self._headers())

            assert res.status_code == 200
            data = res.json()
            assert data["name"] == "Python测试组"
            test_data["deck_id"] = data["id"]
            print(f"✅ 卡片组创建成功: {data['id']}")

    def test_05_list_decks(self):
        """测试获取卡片组列表"""
        with httpx.Client() as client:
            res = client.get(f"{BASE_URL}/decks/", headers=self._headers())

            assert res.status_code == 200
            data = res.json()
            assert len(data) > 0
            print(f"✅ 获取到 {len(data)} 个卡片组")

    # ===== 卡片测试 =====

    def test_06_create_text_card(self):
        """测试创建文本卡片"""
        with httpx.Client() as client:
            res = client.post(f"{BASE_URL}/cards/", json={
                "deck_id": test_data["deck_id"],
                "content_type": "text",
                "front_content": {"type": "text", "value": "什么是Python的GIL？"},
                "back_content": {"type": "text", "value": "全局解释器锁，同一时刻只允许一个线程执行"},
                "tags": ["python", "并发"],
                "notes": "",
            }, headers=self._headers())

            assert res.status_code == 200
            data = res.json()
            assert data["content_type"] == "text"
            assert data["next_review_at"] is not None
            test_data["card_id"] = data["id"]
            print(f"✅ 文本卡片创建成功: {data['id']}")
            print(f"   下次复习: {data['next_review_at']}")

    def test_07_create_code_card(self):
        """测试创建代码卡片"""
        with httpx.Client() as client:
            res = client.post(f"{BASE_URL}/cards/", json={
                "deck_id": test_data["deck_id"],
                "content_type": "code",
                "front_content": {
                    "type": "code",
                    "language": "python",
                    "value": "# 这段代码的输出是什么？\nprint([x**2 for x in range(5)])"
                },
                "back_content": {"type": "text", "value": "[0, 1, 4, 9, 16]"},
                "tags": ["python", "列表推导"],
            }, headers=self._headers())

            assert res.status_code == 200
            print("✅ 代码卡片创建成功")

    def test_08_list_cards(self):
        """测试获取卡片列表"""
        with httpx.Client() as client:
            res = client.get(
                f"{BASE_URL}/cards/deck/{test_data['deck_id']}",
                headers=self._headers()
            )

            assert res.status_code == 200
            data = res.json()
            assert len(data) >= 2
            print(f"✅ 获取到 {len(data)} 张卡片")

    # ===== 复习测试 =====

    def test_09_get_due_cards(self):
        """测试获取待复习卡片"""
        with httpx.Client() as client:
            res = client.get(f"{BASE_URL}/review/due", headers=self._headers())

            assert res.status_code == 200
            data = res.json()
            print(f"✅ 当前待复习: {len(data)} 张卡片")

    def test_10_submit_review_perfect(self):
        """测试提交复习 - 完美记忆"""
        with httpx.Client() as client:
            res = client.post(f"{BASE_URL}/review/submit", json={
                "card_id": test_data["card_id"],
                "quality": 5,
                "time_spent_ms": 3000,
            }, headers=self._headers())

            assert res.status_code == 200
            data = res.json()
            assert "next_review_at" in data
            assert "interval_display" in data
            assert "message" in data
            print(f"✅ 复习提交成功")
            print(f"   评分: 完美(5)")
            print(f"   下次复习: {data['interval_display']}后")
            print(f"   消息: {data['message']}")

    def test_11_submit_review_forgot(self):
        """测试提交复习 - 忘记了"""
        with httpx.Client() as client:
            res = client.post(f"{BASE_URL}/review/submit", json={
                "card_id": test_data["card_id"],
                "quality": 0,
                "time_spent_ms": 8000,
            }, headers=self._headers())

            assert res.status_code == 200
            data = res.json()
            print(f"✅ 忘记后重置成功")
            print(f"   下次复习: {data['interval_display']}后")

    # ===== 统计测试 =====

    def test_12_stats_overview(self):
        """测试统计概览"""
        with httpx.Client() as client:
            res = client.get(f"{BASE_URL}/stats/overview", headers=self._headers())

            assert res.status_code == 200
            data = res.json()
            assert data["total_cards"] >= 2
            assert data["reviewed_today"] >= 2
            print(f"✅ 统计数据:")
            print(f"   总卡片: {data['total_cards']}")
            print(f"   今日已复习: {data['reviewed_today']}")
            print(f"   待复习: {data['due_today']}")

    # ===== 错误处理测试 =====

    def test_13_unauthorized(self):
        """测试未认证访问"""
        with httpx.Client() as client:
            res = client.get(f"{BASE_URL}/decks/")
            assert res.status_code == 401
            print("✅ 未认证请求被正确拒绝")

    def test_14_invalid_card_id(self):
        """测试无效卡片ID"""
        with httpx.Client() as client:
            res = client.post(f"{BASE_URL}/review/submit", json={
                "card_id": "00000000-0000-0000-0000-000000000000",
                "quality": 3,
                "time_spent_ms": 1000,
            }, headers=self._headers())
            assert res.status_code == 404
            print("✅ 无效卡片ID被正确拒绝")

    # ===== 清理测试 =====

    def test_15_delete_card(self):
        """测试删除卡片"""
        with httpx.Client() as client:
            res = client.delete(
                f"{BASE_URL}/cards/{test_data['card_id']}",
                headers=self._headers()
            )
            assert res.status_code == 200
            print("✅ 卡片删除成功")

    def test_16_delete_deck(self):
        """测试删除卡片组"""
        with httpx.Client() as client:
            res = client.delete(
                f"{BASE_URL}/decks/{test_data['deck_id']}",
                headers=self._headers()
            )
            assert res.status_code == 200
            print("✅ 卡片组删除成功（关联卡片一并删除）")