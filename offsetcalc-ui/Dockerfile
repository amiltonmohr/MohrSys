FROM nginx:alpine
COPY dist/index.html /usr/share/nginx/html/index.html
COPY dist/assets     /usr/share/nginx/html/assets
COPY nginx.conf      /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
