import { renderSidebar } from "./sidebar.js";
import { renderHeader } from "./header.js";

export function renderAppLayout({ mountNode, pageTitle, activePage, sesion, content }) {
  mountNode.innerHTML = `
    <div class="min-h-screen lg:flex fade-in">
      <aside class="lg:w-72 bg-slate-900 text-white p-5 lg:sticky top-0 lg:h-screen">${renderSidebar(activePage)}</aside>
      <div class="flex-1 p-4 md:p-6">
        ${renderHeader(pageTitle, sesion)}
        <main id="page-main" class="mt-6 space-y-6">${content}</main>
      </div>
    </div>
    <div id="toast-root" class="fixed top-5 right-5 z-50 space-y-3"></div>
    <div id="modal-root"></div>
  `;
}
