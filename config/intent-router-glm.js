/**
 * GLM-only Intent Router
 * Forces all traffic to GLM-4.7
 */

module.exports = async function router(_req, _config) {
  return "glm,glm-4.7";
};
