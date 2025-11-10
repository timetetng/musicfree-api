const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

// 模拟浏览器环境
global.window = global;
global.document = {
  createElement: () => ({
    setAttribute: () => {},
    appendChild: () => {}
  })
};

global.location = {
  href: 'http://localhost',
  protocol: 'http:',
  host: 'localhost'
};

const { URL } = require('url');
global.URL = URL;

global.crypto = crypto;

class MusicItem {
  constructor(data) {
    this.platform = data.platform || '';
    this.id = data.id || '';
    this.artist = data.artist || '';
    this.title = data.title || '';
    this.duration = data.duration;
    this.album = data.album || '';
    this.artwork = data.artwork || '';
    this.url = data.url || '';
    this.lrc = data.lrc || '';
    this.rawLrc = data.rawLrc || '';
  }

  toDict() {
    return {
      platform: this.platform,
      id: this.id,
      artist: this.artist,
      title: this.title,
      duration: this.duration,
      album: this.album,
      artwork: this.artwork,
      url: this.url,
      lrc: this.lrc,
      rawLrc: this.rawLrc
    };
  }
}

class MusicFreePlugin {
  constructor(name, filePath, metadata) {
    this.name = name;
    this.filePath = filePath;
    this.platform = metadata.platform || name;
    this.author = metadata.author || '未知作者';
    this.version = metadata.version || '0.0.0';
    this.srcUrl = metadata.srcUrl || '';
    this.plugin = metadata.plugin || null;
  }

  isSearchSupported() {
    return this.plugin && typeof this.plugin.search === 'function';
  }

  isMediaSourceSupported() {
    return this.plugin && typeof this.plugin.getMediaSource === 'function';
  }
}

class PluginManager {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.pluginsDir = path.join(dataDir, 'plugins');
    this.subscriptionsDir = path.join(dataDir, 'subscriptions');
    this.plugins = {};
    this.subscriptions = [];

    this._ensureDirectories();
    this._loadSubscriptions();
    this.loadAllPlugins();
  }

  _ensureDirectories() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true });
    }
    if (!fs.existsSync(this.subscriptionsDir)) {
      fs.mkdirSync(this.subscriptionsDir, { recursive: true });
    }
  }

  loadAllPlugins() {
    this.plugins = {};
    console.log('开始加载所有插件...');

    const files = fs.readdirSync(this.pluginsDir);
    for (const file of files) {
      if (file.endsWith('.js')) {
        const filePath = path.join(this.pluginsDir, file);
        try {
          const result = this._loadPlugin(filePath);
          if (result && result.success) {
            const plugin = new MusicFreePlugin(
              result.platform,
              filePath,
              result
            );
            this.plugins[plugin.name] = plugin;
            console.log(`成功加载插件: ${plugin.name} v${plugin.version}`);
          } else {
            const error = result ? result.error : '未知错误';
            console.log(`加载插件失败 ${file}: ${error}`);
          }
        } catch (error) {
          console.error(`加载插件文件 ${file} 时出错:`, error.message);
        }
      }
    }

    console.log(`插件加载完成，共加载 ${Object.keys(this.plugins).length} 个插件`);
  }

  _loadPlugin(pluginPath) {
    try {
      const pluginDir = path.dirname(pluginPath);
      const originalPaths = module.paths.slice();
      module.paths = [path.join(__dirname, '../node_modules'), pluginDir, ...module.paths];

      const pluginModule = new module.constructor();
      pluginModule.paths = module.paths.slice();

      let pluginCode;
      try {
        pluginCode = fs.readFileSync(pluginPath, 'utf8');
      } catch (readError) {
        throw new Error(`无法读取文件: ${readError.message}`);
      }

      try {
        pluginModule._compile(pluginCode, pluginPath);
      } catch (compileError) {
        throw new Error(`编译失败: ${compileError.message}`);
      }

      const plugin = pluginModule.exports;
      module.paths = originalPaths;

      if (!plugin || typeof plugin !== 'object') {
        throw new Error('插件格式无效');
      }

      return {
        success: true,
        platform: plugin.platform || '未知',
        author: plugin.author || '未知作者',
        version: plugin.version || '0.0.0',
        srcUrl: plugin.srcUrl || '',
        plugin: plugin
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async searchMusic(query, pluginName, page, type) {
    const results = [];
    const searchPromises = [];

    if (pluginName && this.plugins[pluginName]) {
      const plugin = this.plugins[pluginName];
      if (plugin.isSearchSupported()) {
        searchPromises.push(this._searchInPlugin(plugin, query, page, type));
      }
    } else {
      for (const [name, plugin] of Object.entries(this.plugins)) {
        if (plugin.isSearchSupported()) {
          searchPromises.push(this._searchInPlugin(plugin, query, page, type));
        }
      }
    }

    if (searchPromises.length === 0) {
      console.log('没有可用的插件进行搜索');
      return results;
    }

    const pluginResults = await Promise.allSettled(searchPromises);

    for (const result of pluginResults) {
      if (result.status === 'fulfilled' && result.value && result.value.data && result.value.data.data) {
        for (const item of result.value.data.data) {
          results.push(new MusicItem(item));
        }
      }
    }

    console.log(`搜索 '${query}' 找到 ${results.length} 个结果`);
    return results;
  }

  async _searchInPlugin(plugin, query, page, type) {
    try {
      if (!plugin.plugin.search) {
        throw new Error('插件不支持搜索功能');
      }

      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('搜索超时')), 20000);
      });

      const searchPromise = plugin.plugin.search(query, page, type);
      const result = await Promise.race([searchPromise, timeout]);

      if (!result || typeof result !== 'object') {
        throw new Error('搜索结果格式无效');
      }

      if (result.data && Array.isArray(result.data)) {
        result.data = result.data.map(item => ({
          id: item.id || '',
          platform: item.platform || plugin.platform,
          title: item.title || item.name || '',
          artist: item.artist || (item.artists && item.artists[0] && item.artists[0].name) || '',
          duration: item.duration || 0,
          album: item.album || '',
          artwork: item.artwork || item.cover || '',
          url: item.url || ''
        }));
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error(`在插件 ${plugin.name} 中搜索失败:`, error.message);
      return null;
    }
  }

  async getMediaSource(musicItem, quality) {
    const pluginName = musicItem.platform;

    let plugin = null;
    if (this.plugins[pluginName]) {
      plugin = this.plugins[pluginName];
    } else {
      for (const [name, p] of Object.entries(this.plugins)) {
        if (pluginName.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(pluginName.toLowerCase())) {
          plugin = p;
          break;
        }
      }
    }

    if (!plugin) {
      console.error(`找不到插件: ${pluginName}`);
      return musicItem.url;
    }

    try {
      if (!plugin.plugin.getMediaSource) {
        return musicItem.url;
      }

      const result = await plugin.plugin.getMediaSource(musicItem, quality);
      return (result && result.url) || musicItem.url;
    } catch (error) {
      console.error('获取音源失败:', error.message);
      return musicItem.url;
    }
  }

  async downloadPlugin(url) {
    try {
      const response = await axios.get(url);
      if (response.status !== 200) {
        throw new Error(`下载失败: HTTP ${response.status}`);
      }

      const content = response.data;
      const fileHash = crypto.createHash('md5').update(content).digest('hex');
      const fileName = `${fileHash}.js`;
      const filePath = path.join(this.pluginsDir, fileName);

      if (fs.existsSync(filePath)) {
        console.log(`插件已存在: ${fileName}`);
        return true;
      }

      fs.writeFileSync(filePath, content);

      const testResult = this._loadPlugin(filePath);
      if (testResult && testResult.success) {
        console.log(`插件下载并验证成功: ${fileName}`);
        this.loadAllPlugins();
        return true;
      } else {
        fs.unlinkSync(filePath);
        console.log(`插件无效，已删除: ${fileName}`);
        return false;
      }
    } catch (error) {
      console.error('下载插件失败:', error.message);
      return false;
    }
  }

  async updateSubscriptions() {
    const results = {
      success: [],
      failed: []
    };

    for (const subUrl of this.subscriptions) {
      try {
        console.log(`更新订阅: ${subUrl}`);

        const pluginsJsonPath = path.join(this.subscriptionsDir, 'plugins.json');
        let subData;

        if (fs.existsSync(pluginsJsonPath)) {
          console.log('使用本地 plugins.json');
          subData = JSON.parse(fs.readFileSync(pluginsJsonPath, 'utf8'));
        } else {
          const response = await axios.get(subUrl);
          if (response.status !== 200) {
            throw new Error(`HTTP ${response.status}`);
          }
          subData = response.data;
        }

        if (!subData.plugins) {
          throw new Error('订阅数据格式无效');
        }

        let downloadedCount = 0;
        for (const pluginInfo of subData.plugins) {
          const pluginUrl = pluginInfo.url;
          const pluginName = pluginInfo.name || '未知';

          if (pluginUrl) {
            console.log(`下载插件: ${pluginName}`);
            if (await this.downloadPlugin(pluginUrl)) {
              downloadedCount++;
              console.log(`插件下载成功: ${pluginName}`);
            }
          }
        }

        results.success.push({
          url: subUrl,
          downloaded: downloadedCount
        });
        console.log(`订阅 ${subUrl} 更新完成，下载了 ${downloadedCount} 个插件`);

      } catch (error) {
        console.error(`更新订阅失败:`, error.message);
        results.failed.push({
          url: subUrl,
          error: error.message
        });
      }
    }

    this.loadAllPlugins();
    return results;
  }

  _loadSubscriptions() {
    const configPath = path.join(this.dataDir, 'subscriptions.json');
    if (fs.existsSync(configPath)) {
      try {
        this.subscriptions = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log(`加载了 ${this.subscriptions.length} 个订阅`);
      } catch (error) {
        console.error('加载订阅列表失败:', error.message);
      }
    }
  }

  getPluginList() {
    const pluginList = [];
    for (const [name, plugin] of Object.entries(this.plugins)) {
      pluginList.push({
        name: name,
        author: plugin.author,
        version: plugin.version,
        type: '本地插件'
      });
    }
    return pluginList;
  }

  getPluginCount() {
    return Object.keys(this.plugins).length;
  }
}

module.exports = PluginManager;
