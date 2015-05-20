//Define a property checker for https page
module.exports = {
  mixedContent: (typeof window !== "undefined" ? (window.location.protocol === "https:") : false)
};
