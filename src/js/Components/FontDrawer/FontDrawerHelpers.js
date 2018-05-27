const modelCharIndex = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const charToDecodeIndex = char => {
  if (!char || !char.trim()) { return; }
  return modelCharIndex.indexOf(char);
};
module.exports = { charToDecodeIndex }
