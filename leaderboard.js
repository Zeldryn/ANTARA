"use strict";

(() => {
  const $ = selector => document.querySelector(selector);
  const tabs = Array.from(document.querySelectorAll(".lb-tab"));
  const podium = $("#lb-podium");
  const list = $("#lb-list");
  const empty = $("#lb-empty");
  const error = $("#lb-error");
  const retry = $("#lb-retry");
  const account = $("#lb-account");
  let currentBoard = "completion";
  let currentUser = null;

  const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));

  const formatDate = value => {
    if (!value) return "Belum tercatat";
    const date = new Date(String(value).replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return "Belum tercatat";
    return new Intl.DateTimeFormat("id-ID", { dateStyle:"medium", timeStyle:"short" }).format(date);
  };

  const formatScore = score => new Intl.NumberFormat("id-ID").format(Number(score) || 0);

  async function fetchJson(url) {
    const response = await fetch(url, { credentials:"same-origin", headers:{ Accept:"application/json" } });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  }

  async function loadIdentity() {
    try {
      const { data } = await fetchJson("api/auth/me.php");
      if (data.success && data.authenticated && data.user) {
        currentUser = data.user;
        account.innerHTML = `<i></i><span>${escapeHtml(data.user.name || data.user.username || "PENJELAJAH")}</span>`;
      } else {
        currentUser = null;
        account.innerHTML = "<i></i><span>BELUM MASUK</span>";
      }
    } catch {
      currentUser = null;
      account.innerHTML = "<i></i><span>STATUS AKUN TIDAK TERBACA</span>";
    }
  }

  function boardCopy(board) {
    if (board === "game") return {
      kicker:"BEST RECORD QUIZ",
      title:"Peringkat Quiz ANTARA",
      emptyKicker:"BELUM ADA BINTANG QUIZ",
      emptyTitle:"Arena quiz masih kosong.",
      emptyCopy:"Selesaikan satu tantangan 15 / 15. Setiap akun dinilai dari skor terbaiknya."
    };
    return {
      kicker:"URUTAN PENYELESAIAN",
      title:"Penjelajah 100%",
      emptyKicker:"BELUM ADA PENJELAJAH 100%",
      emptyTitle:"Peringkat pertama masih kosong.",
      emptyCopy:"Penjelajah pertama yang menuntaskan seluruh perjalanan akan membuka posisi ini."
    };
  }

  function applyBoardCopy(board) {
    const copy = boardCopy(board);
    $("#lb-board-kicker").textContent = copy.kicker;
    $("#lb-board-title").textContent = copy.title;
    $("#lb-empty-kicker").textContent = copy.emptyKicker;
    $("#lb-empty-title").textContent = copy.emptyTitle;
    $("#lb-empty-copy").textContent = copy.emptyCopy;
  }

  function entryDetail(entry, board) {
    if (board === "game") return { main:`BEST ${formatScore(entry.score)} poin`, sub:formatDate(entry.achievedAt) };
    return { main:"100% selesai", sub:formatDate(entry.completedAt) };
  }

  const rankPlanets = ["earth","mars","jupiter","saturn","uranus","neptune","venus","mercury"];
  function rankPlanet(entry) {
    const index = Math.max(0, (Number(entry.rank) || 1) - 1) % rankPlanets.length;
    return `assets/progress-planets/${rankPlanets[index]}.png`;
  }

  function avatarMarkup(entry, size = "podium") {
    const label = escapeHtml(entry.name || entry.username || "Penjelajah");
    const initial = escapeHtml((entry.name || entry.username || "P").trim().charAt(0).toUpperCase());
    const avatar = String(entry.avatar || "").trim();
    const classes = size === "row" ? "lb-avatar lb-avatar-row" : "lb-avatar lb-avatar-podium";
    return avatar
      ? `<span class="${classes}"><img src="${escapeHtml(avatar)}" alt="Foto profil ${label}" loading="lazy"></span>`
      : `<span class="${classes} is-fallback" aria-hidden="true">${initial}</span>`;
  }

  function podiumCard(entry, board) {
    const detail = entryDetail(entry, board);
    return `<article class="lb-podium-card" tabindex="0"> <span class="lb-podium-rank">${entry.rank}</span> <div class="lb-podium-visual">${avatarMarkup(entry, "podium")}<img class="lb-rank-planet" src="${rankPlanet(entry)}" alt="" loading="lazy"></div> <div><strong class="lb-podium-name">${escapeHtml(entry.name || entry.username)}</strong><span class="lb-podium-user">@${escapeHtml(entry.username)}</span></div> <span class="lb-podium-detail">${escapeHtml(detail.main)}<br>${escapeHtml(detail.sub)}</span> </article>`;
  }

  function rowCard(entry, board) {
    const detail = entryDetail(entry, board);
    return `<article class="lb-row" tabindex="0"> <span class="lb-row-rank">#${entry.rank}</span> ${avatarMarkup(entry, "row")} <img class="lb-row-planet" src="${rankPlanet(entry)}" alt="" loading="lazy"> <div class="lb-row-person"><strong>${escapeHtml(entry.name || entry.username)}</strong><span>@${escapeHtml(entry.username)}</span></div> <div class="lb-row-detail"><strong>${escapeHtml(detail.main)}</strong><span>${escapeHtml(detail.sub)}</span></div> </article>`;
  }

  function renderMe(data, board) {
    const rankEl = $("#lb-me-rank");
    const copyEl = $("#lb-me-copy");
    if (!currentUser) {
      rankEl.textContent = "BELUM MASUK";
      copyEl.textContent = "Masuk ke akun ANTARA untuk melihat posisi pribadimu di leaderboard.";
      return;
    }
    if (!data.me) {
      rankEl.textContent = "BELUM MASUK RANKING";
      copyEl.textContent = board === "game" ? "Belum ada skor quiz untuk akun ini. Coba main satu sesi!" : "Selesaikan seluruh perjalanan ANTARA untuk mendapatkan nomor peringkat.";
      return;
    }
    if (board === "completion" && data.me.eligible === false) {
      rankEl.textContent = "BELUM MASUK PAPAN";
      copyEl.textContent = "Progress kamu sudah penuh. Buka kembali halaman ini setelah perjalanan terakhir tersimpan.";
      return;
    }
    rankEl.textContent = `#${data.me.rank}`;
    copyEl.textContent = board === "game" ? `Skor terbaikmu ${formatScore(data.me.score)} poin.` : `Kamu menyelesaikan 100% pada ${formatDate(data.me.completedAt)}.`;
  }

  function renderBoard(data, board) {
    const entries = Array.isArray(data.entries) ? data.entries : [];
    error.hidden = true;
    const top = entries.slice(0, 3);
    const rest = entries.slice(3);
    podium.innerHTML = top.map(entry => podiumCard(entry, board)).join("");
    podium.hidden = top.length === 0;
    list.innerHTML = rest.map(entry => rowCard(entry, board)).join("");
    empty.hidden = entries.length !== 0;
    $("#lb-board-state").textContent = board === "game" ? "QUIZ ANTARA" : "PROGRESS ANTARA";
    renderMe(data, board);
  }

  function showError(message) {
    podium.hidden = true;
    list.innerHTML = "";
    empty.hidden = true;
    error.hidden = false;
    $("#lb-error-copy").textContent = message || "Coba buka lagi sebentar.";
  }

  async function loadBoard(board = currentBoard) {
    currentBoard = board;
    retry.disabled = true;
    applyBoardCopy(board);
    tabs.forEach(tab => {
      const active = tab.dataset.board === board;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    try {
      const url = board === "game" ? "api/leaderboard/get.php?type=game&game=quiz15&limit=50" : "api/leaderboard/get.php?type=completion&limit=50";
      const { response, data } = await fetchJson(url);
      if (!response.ok || !data.success) throw new Error(data.message || "Leaderboard gagal dimuat.");
      renderBoard(data, board);
    } catch (err) {
      console.warn("ANTARA leaderboard", err);
      showError(err.message);
    } finally {
      retry.disabled = false;
    }
  }

  tabs.forEach(tab => tab.addEventListener("click", () => loadBoard(tab.dataset.board || "completion")));
  retry.addEventListener("click", () => loadBoard(currentBoard));

  (async () => {
    await loadIdentity();
    await loadBoard("completion");
  })();
})();
