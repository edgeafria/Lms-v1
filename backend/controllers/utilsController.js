// In: backend/controllers/utilsController.js
const axios = require('axios');

/**
 * @desc    Get YouTube video details from oEmbed API
 * @route   GET /api/utils/oembed
 * @access  Private (Requires user to be logged in)
 */
exports.getOEmbedDetails = async (req, res, next) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ 
      success: false, 
      message: 'URL query parameter is required' 
    });
  }

  // Use YouTube's oEmbed API to get video details
  const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;

  try {
    // Make the request to YouTube's API
    const { data } = await axios.get(oEmbedUrl);

    // Send back just the title
    res.json({ success: true, title: data.title });

  } catch (error) {
    console.error('oEmbed fetch error:', error.message);
    
    // Send a generic title so the frontend doesn't break
    // We send 200 OK because this isn't a server-crashing error
    res.status(200).json({ 
      success: false, 
      title: 'Video Lesson' // A safe fallback title
    });
  }
};