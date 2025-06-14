# Crawler AI Chrome Extension

这是一个Chrome浏览器插件，用于网页爬取和AI处理。

## 功能特点

- 网页内容爬取
- 数据提取和处理
- 用户友好的界面
- 实时状态显示

## 安装说明

1. 克隆此仓库到本地
2. 打开Chrome浏览器，进入扩展程序页面（chrome://extensions/）
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目目录

## 使用方法

1. 点击Chrome工具栏中的插件图标
2. 在弹出窗口中使用"Start Crawling"按钮开始爬取
3. 使用"Stop Crawling"按钮停止爬取
4. 查看状态信息了解当前爬取状态

## 开发说明

- manifest.json: 插件配置文件
- popup.html/js: 弹出窗口界面和逻辑
- background.js: 后台服务脚本
- content.js: 页面内容处理脚本
- styles.css: 样式文件

## 注意事项

- 请确保遵守目标网站的robots.txt规则
- 建议适当控制爬取频率，避免对目标服务器造成压力