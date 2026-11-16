# MOVRIT 화면 이미지입니다. 1단계에서 화면을 빌드하고, 2단계는 nginx가 빌드 결과를 보여 주면서 /api·/uploads 요청을 백엔드로 넘깁니다.
# 빌드: docker build -t movrit-frontend .   (백엔드 저장소의 docker-compose.yml이 이 이미지를 함께 띄웁니다)
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# 네이버 지도 Client ID는 빌드할 때 넣습니다(브라우저에 공개되는 값이지만 저장소에는 두지 않음).
# 예: docker build --build-arg VITE_NAVER_MAP_KEY_ID=... .  비우면 지도 없이 주소만 보입니다.
ARG VITE_NAVER_MAP_KEY_ID=
ENV VITE_NAVER_MAP_KEY_ID=$VITE_NAVER_MAP_KEY_ID
RUN npm run build

FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
