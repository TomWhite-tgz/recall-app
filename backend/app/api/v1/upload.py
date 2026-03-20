from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.core.auth import get_current_user
from app.models.card import User
import boto3
from botocore.client import Config
import uuid
from app.config import settings

router = APIRouter()

# MinIO 客户端
s3_client = boto3.client(
    's3',
    endpoint_url='http://localhost:9000',
    aws_access_key_id='minioadmin',
    aws_secret_access_key='minioadmin123',
    config=Config(signature_version='s3v4'),
)

BUCKET_NAME = 'recall-uploads'
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB

# 允许的文件类型
ALLOWED_TYPES = {
    'image/png', 'image/jpeg', 'image/gif', 'image/webp',
    'application/pdf',
    'audio/mpeg', 'audio/wav',
}


@router.post("/file")
async def upload_file(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    """上传文件（图片、PDF、音频）"""

    # 检查文件类型
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件类型: {file.content_type}"
        )

    # 读取文件
    content = await file.read()

    # 检查大小
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="文件不能超过20MB")

    # 生成唯一文件名
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'bin'
    key = f"{user.id}/{uuid.uuid4().hex}.{ext}"

    # 确保 bucket 存在
    try:
        s3_client.head_bucket(Bucket=BUCKET_NAME)
    except:
        s3_client.create_bucket(Bucket=BUCKET_NAME)

    # 上传到 MinIO
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=key,
        Body=content,
        ContentType=file.content_type,
    )

    # 生成访问 URL
    url = f"http://localhost:9000/{BUCKET_NAME}/{key}"

    return {
        "url": url,
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(content),
    }