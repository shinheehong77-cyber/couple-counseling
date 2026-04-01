#!/bin/bash
set -euo pipefail

echo "=== 부부상담 앱 프로덕션 배포 ==="

# Pre-flight checks
echo "1. 환경 변수 확인..."
required_vars=("DATABASE_URL" "DATABASE_AUTH_TOKEN" "ANTHROPIC_API_KEY")
for var in "${required_vars[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "  ❌ $var 미설정"
    exit 1
  fi
  echo "  ✓ $var"
done

echo "2. 빌드..."
npx prisma generate
npm run build

echo "3. DB 마이그레이션..."
npx prisma migrate deploy

echo "4. 헬스체크..."
if [ -n "${NEXT_PUBLIC_APP_URL:-}" ]; then
  echo "  배포 후 $NEXT_PUBLIC_APP_URL/api/health 확인 필요"
fi

echo ""
echo "=== 배포 준비 완료 ==="
echo "Render: git push 후 자동 배포"
echo "Docker: docker build -t couple-counseling . && docker run -p 3000:3000 --env-file .env.production couple-counseling"
