import { renderSidebar } from "./sidebar.js";
import { renderHeader } from "./header.js";
import { icon } from "./icons.js";

const SIDEBAR_COLLAPSED_KEY = "sidebar_collapsed";

export function renderAppLayout({ mountNode, pageTitle, activePage, sesion, content }) {
  const collapsed = (() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  })();

  mountNode.innerHTML = `
    <div class="min-h-screen lg:flex fade-in">
      <aside id="app-sidebar" class="app-sidebar ${collapsed ? "sidebar-collapsed" : ""} bg-slate-900 text-white p-5 lg:sticky top-0 lg:h-screen transition-all duration-300">${renderSidebar(activePage, collapsed)}</aside>
      <div class="flex-1 p-4 md:p-6">
        ${renderHeader(pageTitle, sesion)}
        <main id="page-main" class="mt-6 space-y-6">${content}</main>
      </div>
    </div>
    <div id="toast-root" class="fixed top-5 right-5 z-50 space-y-3"></div>
    <div id="modal-root"></div>
  `;

  const sidebar = document.getElementById("app-sidebar");
  const toggleBtn = document.getElementById("btn-sidebar-toggle");

  const updateToggleState = (isCollapsed) => {
    if (!toggleBtn) return;
    toggleBtn.innerHTML = isCollapsed ? icon("chevronRight", "w-5 h-5") : icon("chevronLeft", "w-5 h-5");
    toggleBtn.title = isCollapsed ? "Expandir menu" : "Colapsar menu";
    toggleBtn.setAttribute("aria-label", toggleBtn.title);
  };

  updateToggleState(collapsed);

  toggleBtn?.addEventListener("click", () => {
    const nextCollapsed = !sidebar?.classList.contains("sidebar-collapsed");
    sidebar?.classList.toggle("sidebar-collapsed", nextCollapsed);
    updateToggleState(nextCollapsed);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, nextCollapsed ? "1" : "0");
    } catch {
      // ignorar si localStorage no esta disponible
    }
  });
}
