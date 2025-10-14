/**
 * Google Sites Content Generator
 * Since we can't automate site structure, we'll generate embeddable content
 */

// Generate navigation HTML for embedding
function generateNavigationHTML() {
  const pages = [
    { name: "Home", icon: "🏠", url: "#home" },
    { name: "Staff Directory", icon: "👥", url: "#directory" },
    { name: "My Schedule", icon: "📅", url: "#schedule" },
    { name: "Request Time Off", icon: "⏰", url: "#timeoff" },
    { name: "Admin Tools", icon: "⚙️", url: "#admin", restricted: true }
  ];
  
  let html = '<div class="site-navigation">';
  pages.forEach(page => {
    if (page.restricted && !isUserAdmin()) return; // Skip admin links for non-admins
    html += `<a href="${page.url}" class="nav-link">${page.icon} ${page.name}</a>`;
  });
  html += '</div>';
  
  return html;
}

// Generate dashboard content
function generateDashboardHTML() {
  const user = Session.getActiveUser().getEmail();
  const today = new Date().toLocaleDateString();
  
  return `
    <div class="dashboard">
      <h2>Welcome to Madison Scheduling</h2>
      <p>Hello ${user}!</p>
      <p>Today is ${today}</p>
      
      <div class="quick-actions">
        <a href="#schedule" class="action-button">📅 View My Schedule</a>
        <a href="#timeoff" class="action-button">⏰ Request Time Off</a>
        <a href="#directory" class="action-button">👥 Staff Directory</a>
      </div>
    </div>
  `;
}

// Helper function to check admin status
function isUserAdmin() {
  const user = Session.getActiveUser().getEmail();
  const adminEmails = ['your-email@gmail.com']; // Add admin emails
  return adminEmails.includes(user);
}

// Generate embeddable content for any page
function getPageContent(pageName) {
  switch(pageName.toLowerCase()) {
    case 'dashboard':
    case 'home':
      return generateDashboardHTML();
    case 'navigation':
      return generateNavigationHTML();
    default:
      return '<p>Page content not found</p>';
  }
}