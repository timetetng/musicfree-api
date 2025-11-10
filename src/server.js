const express = require('express');
const cors = require('cors');
const path = require('path');

const PluginManager = require('./pluginManager');
const config = require('../config/config');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 初始化插件管理器
const pluginManager = new PluginManager(config.dataDir);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    plugins: pluginManager.getPluginCount()
  });
});

// 获取插件列表
app.get('/api/plugins', (req, res) => {
  try {
    const plugins = pluginManager.getPluginList();
    res.json({
      success: true,
      data: plugins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 搜索音乐
app.post('/api/search', async (req, res) => {
  try {
    const { query, pluginName, page = 1, type = 'music' } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: '缺少查询参数: query'
      });
    }

    const results = await pluginManager.searchMusic(query, pluginName, page, type);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('搜索错误:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取音乐音源
app.post('/api/media', async (req, res) => {
  try {
    const { musicItem, quality = 'standard' } = req.body;

    if (!musicItem) {
      return res.status(400).json({
        success: false,
        error: '缺少音乐项参数: musicItem'
      });
    }

    const url = await pluginManager.getMediaSource(musicItem, quality);

    res.json({
      success: true,
      url: url
    });
  } catch (error) {
    console.error('获取音源错误:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 更新订阅
app.post('/api/subscription/update', async (req, res) => {
  try {
    const results = await pluginManager.updateSubscriptions();

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('更新订阅错误:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 安装插件
app.post('/api/plugin/install', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: '缺少插件URL参数: url'
      });
    }

    const success = await pluginManager.downloadPlugin(url);

    res.json({
      success: success,
      message: success ? '插件安装成功' : '插件安装失败'
    });
  } catch (error) {
    console.error('安装插件错误:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 静态文件服务
app.use('/api/static', express.static(config.dataDir));

// 启动服务器
app.listen(PORT, () => {
  console.log(`MusicFree API 服务器启动在端口 ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
  console.log(`数据目录: ${config.dataDir}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  process.exit(0);
});
