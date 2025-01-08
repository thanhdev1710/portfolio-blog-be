# Sử dụng image Node.js chính thức
FROM node:18-alpine

# Đặt thư mục làm việc trong container
WORKDIR /src

# Copy package.json và package-lock.json hoặc yarn.lock vào container
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ mã nguồn vào container
COPY . .

# Build ứng dụng (nếu bạn sử dụng Webpack)
RUN npm run start:build

# Mở cổng mà ứng dụng sẽ chạy (ví dụ cổng 5001)
EXPOSE 5001

# Lệnh chạy ứng dụng trong container
CMD ["npm", "run", "start:run"]
