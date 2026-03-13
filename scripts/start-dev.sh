#!/bin/bash
echo "============================================"
echo "  🚀 启动 Recall 开发环境"
echo "============================================"

cd ~/projects/recall-app

# 1. 启动数据库
echo "📦 启动 PostgreSQL + Redis..."
docker compose -f docker-compose.dev.yml up -d
sleep 3
docker compose -f docker-compose.dev.yml ps

# 2. 启动后端
echo "🐍 启动后端 API..."
cd backend
conda activate recall
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
