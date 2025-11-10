module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { musicItem, quality = 'standard' } = req.body;

    if (!musicItem) {
      return res.status(400).json({
        success: false,
        error: '缺少音乐项参数: musicItem'
      });
    }

    res.json({
      success: true,
      url: musicItem.url || ''
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
