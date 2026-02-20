#!/bin/bash
set -e
APP_NAME="partygengweb"
REGISTRY="partygeng"
VERSION=${1:-latest}
COMPOSE_FILE="docker-compose.yml"
echo "🚀 Starting deployment of $APP_NAME:$VERSION"
echo "📥 Pulling latest image..."
docker pull $REGISTRY/$APP_NAME:$VERSION
if [ "$VERSION" != "latest" ]; then
    sed -i "s|image: $REGISTRY/$APP_NAME:.*|image: $REGISTRY/$APP_NAME:$VERSION|g" $COMPOSE_FILE
fi
echo "🛑 Stopping existing containers..."
docker-compose down
echo "🔄 Starting new containers..."
docker-compose up -d
echo "🧹 Cleaning up old images..."
docker image prune -f
echo "🏥 Checking application health..."
sleep 10
if curl -f <http://localhost:3000> > /dev/null 2>&1; then
    echo "✅ Deployment successful! Application is running."
else
    echo "❌ Deployment failed! Application is not responding."
    exit 1
fi
echo "🎉 Deployment completed successfully!"
