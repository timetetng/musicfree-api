module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { query, pluginName, page = 1, type = 'music' } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: '缺少查询参数: query'
      });
    }

    // 在 serverless 环境下，插件数据可能需要从外部存储获取
    // 这里只是示例实现
    res.json({
      success: true,
      message: 'Serverless 环境下的搜索功能需要额外的配置',
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
