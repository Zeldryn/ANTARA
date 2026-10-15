"use strict";
(() => {
  const $ = s => document.querySelector(s);
  const intro = $("#game-intro");
  const stage = $("#quiz-stage");
  const resultStage = $("#result-stage");
  const errorStage = $("#game-error");
  const startBtn = $("#game-start");
  const account = $("#game-account");
  const loginNote = $("#game-login-note");
  const optionsHost = $("#quiz-options");
  const feedback = $("#quiz-feedback");
  const nextBtn = $("#quiz-next");
  const stackWarning = $("#quiz-stack-warning");

  let user = null;
  let runToken = "";
  let currentQuestion = null;
  let currentStack = null;
  let score = 0;
  let streak = 0;
  let timerFrame = 0;
  let timerStartedAt = 0;
  let timerLimit = 0;
  let submitting = false;
  let pendingFinished = null;
  let pendingLevelAdvance = null;
  let audioContext = null;

  const esc = value => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const formatScore = value => new Intl.NumberFormat("id-ID").format(Number(value) || 0);

  async function json(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      ...options,
      headers: { Accept: "application/json", ...(options.body ? { "Content-Type":"application/json" } : {}), ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      const error = new Error(data.message || `Request gagal (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  function getAudio() {
    try {
      if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
      return audioContext;
    } catch { return null; }
  }

  function tone(freq, start, duration, gain = .05, type = "sine") {
    const ctx = getAudio(); if (!ctx) return;
    const osc = ctx.createOscillator(); const amp = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
    amp.gain.setValueAtTime(0.0001, ctx.currentTime + start);
    amp.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + .015);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
    osc.connect(amp).connect(ctx.destination); osc.start(ctx.currentTime + start); osc.stop(ctx.currentTime + start + duration + .03);
  }
  function soundCorrect(){tone(520,0,.13,.055);tone(680,.10,.15,.05);tone(860,.22,.18,.045)}
  function soundWrong(){tone(210,0,.18,.06,"triangle");tone(155,.12,.22,.05,"triangle")}
  function soundTick(){tone(440,0,.055,.018,"square")}
  function soundStart(){tone(330,0,.08,.04);tone(520,.08,.11,.04)}
  function soundLevel(){tone(480,0,.11,.05);tone(650,.10,.13,.05);tone(820,.21,.17,.05);tone(1040,.34,.2,.04)}

  async function loadIdentity() {
    try {
      const data = await json("api/auth/me.php");
      if (data.authenticated && data.user) {
        user = data.user;
        account.innerHTML = `<i></i><span>${esc(user.name || user.username || "PENJELAJAH")}</span>`;
        loginNote.textContent = "Setiap jawaban diverifikasi server. Kuasai 15/15 untuk membuka level berikutnya.";
        startBtn.disabled = false;
      } else {
        user = null; startBtn.disabled = true;
        account.innerHTML = "<i></i><span>BELUM MASUK</span>";
        loginNote.innerHTML = 'Masuk dulu agar skor bisa diverifikasi. <a href="daftar.html">MASUK / DAFTAR</a>';
      }
    } catch {
      user = null; startBtn.disabled = true;
      account.innerHTML = "<i></i><span>AKUN TIDAK TERBACA</span>";
      loginNote.textContent = "Koneksi akun belum tersedia.";
    }
  }

  function showError(message) {
    cancelAnimationFrame(timerFrame); timerFrame = 0;
    intro.hidden = true; stage.hidden = true; resultStage.hidden = true; errorStage.hidden = false;
    $("#game-error-copy").textContent = message || "Periksa Apache, MySQL, dan koneksi database ANTARA.";
  }

  function updateHud() {
    $("#quiz-score").textContent = formatScore(score);
    $("#quiz-streak").textContent = `×${streak}`;
    if (currentQuestion) {
      const stackPosition = Number(currentQuestion.stackPosition || 1);
      const total = Number(currentQuestion.stackTotal || 15);
      $("#quiz-progress").textContent = `${String(stackPosition).padStart(2,"0")} / ${total}`;
      $("#quiz-level").textContent = currentQuestion.levelLabel;
    }
    const mastered = Number(currentStack?.mastered || 0);
    const total = Number(currentStack?.total || 15);
    $("#quiz-mastered").textContent = `${mastered} / ${total}`;
    $("#quiz-mastered").closest(".quiz-hud-item")?.classList.toggle("is-complete", mastered >= total && total > 0);
  }

  function stopTimer() { cancelAnimationFrame(timerFrame); timerFrame = 0; }
  function startTimer(ms) {
    stopTimer(); timerLimit = ms; timerStartedAt = performance.now();
    let lastWhole = Math.ceil(ms / 1000);
    const timer = $("#quiz-timer"); const bar = $("#quiz-timer-bar");
    const frame = now => {
      const elapsed = now - timerStartedAt;
      const remaining = Math.max(0, timerLimit - elapsed);
      const ratio = timerLimit ? remaining / timerLimit : 0;
      timer.style.setProperty("--timer", String(ratio));
      bar.style.transform = `scaleX(${ratio})`;
      $("#quiz-time").textContent = (remaining / 1000).toFixed(1);
      timer.classList.toggle("is-low", remaining <= 3000);
      const whole = Math.ceil(remaining / 1000);
      if (whole <= 3 && whole > 0 && whole !== lastWhole) soundTick();
      lastWhole = whole;
      if (remaining <= 0) { timerFrame = 0; submitAnswer(""); return; }
      timerFrame = requestAnimationFrame(frame);
    };
    timerFrame = requestAnimationFrame(frame);
  }

  function renderQuestion(question, stack = null) {
    currentQuestion = question;
    if (stack) currentStack = stack;
    submitting = false; pendingFinished = null; pendingLevelAdvance = null;
    feedback.hidden = true; feedback.classList.remove("is-wrong", "is-stack-complete");
    stackWarning.hidden = true; stackWarning.className = "quiz-stack-warning"; stackWarning.textContent = "";
    $("#quiz-planet").textContent = question.planet.toUpperCase();
    $("#quiz-topic").textContent = question.isRetry
      ? `ULANGAN · ${question.topic} · PERCOBAAN ${question.attemptNumber}`
      : question.topic;
    $("#quiz-question").textContent = question.question;
    optionsHost.innerHTML = Object.entries(question.options).map(([key,value]) =>
      `<button class="quiz-option" type="button" data-key="${key}"><b>${key}</b><span>${esc(value)}</span></button>`
    ).join("");
    optionsHost.querySelectorAll(".quiz-option").forEach(btn => btn.addEventListener("click", () => submitAnswer(btn.dataset.key || "")));
    updateHud();
    startTimer(question.timeLimitMs);
  }

  async function startGame() {
    if (!user || startBtn.disabled) return;
    startBtn.disabled = true; getAudio(); soundStart();
    try {
      const data = await json("api/quiz/start.php", { method:"POST", body:"{}" });
      runToken = data.runToken; score = data.score || 0; streak = data.streak || 0; currentStack = data.stack || null;
      intro.hidden = true; resultStage.hidden = true; errorStage.hidden = true; stage.hidden = false;
      renderQuestion(data.question, data.stack);
      window.scrollTo({ top:0, behavior:"smooth" });
    } catch (error) { showError(error.message); }
    finally { startBtn.disabled = !user; }
  }

  function setStackWarning(data) {
    stackWarning.hidden = true;
    stackWarning.className = "quiz-stack-warning";
    stackWarning.textContent = "";
    if (data.finished) return;
    if (data.stackComplete && data.nextLevel) {
      stackWarning.hidden = false;
      stackWarning.classList.add("is-complete");
      stackWarning.innerHTML = `<strong>LEVEL ${esc(data.stack.label)} TUNTAS · 15 / 15</strong><span>Semua soal sudah benar. Level ${esc(data.nextLevel.label)} sekarang terbuka.</span>`;
      return;
    }
    if (data.needsRetry) {
      stackWarning.hidden = false;
      stackWarning.classList.add("is-locked");
      const remaining = Number(data.stack?.remaining || 0);
      stackWarning.innerHTML = `<strong>BELUM BISA NAIK LEVEL</strong><span>Kuasai 15 / 15 dulu. ${remaining} soal yang belum benar akan diulang sampai kamu menguasainya.</span>`;
    }
  }

  async function submitAnswer(key) {
    if (submitting || !currentQuestion || !runToken) return;
    submitting = true; stopTimer();
    optionsHost.querySelectorAll("button").forEach(btn => btn.disabled = true);
    try {
      const data = await json("api/quiz/answer.php", {
        method:"POST",
        body:JSON.stringify({ runToken, position:currentQuestion.position, answer:key || null })
      });
      score = data.scoreTotal || 0; streak = data.streak || 0; currentStack = data.stack || currentStack; updateHud();
      optionsHost.querySelectorAll(".quiz-option").forEach(btn => {
        if (btn.dataset.key === data.correctKey) btn.classList.add("is-correct");
        if (key && btn.dataset.key === key && !data.correct) btn.classList.add("is-wrong");
      });
      if (data.correct) soundCorrect(); else soundWrong();
      feedback.hidden = false; feedback.classList.toggle("is-wrong", !data.correct); feedback.classList.toggle("is-stack-complete", !!data.stackComplete);
      $("#feedback-status").textContent = data.finished ? "SEMUA LEVEL TUNTAS" : data.stackComplete ? "LEVEL TUNTAS" : data.timedOut ? "WAKTU HABIS" : (data.correct ? "TEPAT" : "BELUM TEPAT");
      $("#feedback-points").textContent = data.points > 0 ? `+${formatScore(data.points)}` : "+0";
      $("#feedback-correct").textContent = `Jawaban: ${data.correctKey}. ${data.correctText}`;
      $("#feedback-explanation").textContent = data.explanation || "";
      $("#feedback-reference").textContent = data.reference ? `ACUAN ANTARA · ${data.reference}` : "";
      pendingFinished = data.finished ? data.summary : null;
      pendingLevelAdvance = data.stackComplete && data.nextLevel ? data.nextLevel : null;
      setStackWarning(data);
      if (data.finished) {
        nextBtn.textContent = "LIHAT HASIL →";
      } else if (pendingLevelAdvance) {
        nextBtn.textContent = `NAIK KE ${pendingLevelAdvance.label} →`;
        soundLevel();
      } else if (data.needsRetry) {
        nextBtn.textContent = `ULANGI YANG BELUM BENAR (${data.stack.remaining}) →`;
      } else {
        nextBtn.textContent = "LANJUT →";
      }
      feedback.scrollIntoView({ behavior:"smooth", block:"nearest" });
    } catch (error) { showError(error.message); }
  }

  async function goNext() {
    if (pendingFinished) { showResult(pendingFinished); return; }
    if (!currentQuestion || !runToken) return;
    const level = Number(currentQuestion.level || 0);
    const advanceLevel = !!pendingLevelAdvance;
    nextBtn.disabled = true;
    const oldText = nextBtn.textContent;
    nextBtn.textContent = advanceLevel ? `MEMBUKA ${pendingLevelAdvance.label}...` : "MENYIAPKAN SOAL...";
    try {
      const data = await json("api/quiz/next.php", {
        method:"POST",
        body:JSON.stringify({ runToken, level, advanceLevel })
      });
      score = data.score || score; streak = data.streak || 0; currentStack = data.stack || currentStack;
      renderQuestion(data.question, data.stack);
      window.scrollTo({ top:0, behavior:"smooth" });
    } catch (error) {
      nextBtn.textContent = oldText;
      showError(error.message);
    } finally { nextBtn.disabled = false; }
  }

  function showResult(summary) {
    stage.hidden = true; intro.hidden = true; errorStage.hidden = true; resultStage.hidden = false;
    $("#result-score").textContent = formatScore(summary.score);
    $("#result-correct").textContent = `${summary.correct} / ${summary.total}`;
    $("#result-accuracy").textContent = `${summary.firstTryCorrect || 0} / ${summary.total || 75} · ${summary.accuracy}%`;
    $("#result-streak").textContent = `×${summary.bestStreak}`;
    $("#result-speed").textContent = `${((summary.avgResponseMs || 0)/1000).toFixed(1)}s`;
    window.AntaraAchievementNotifications?.checkPending?.();
    window.scrollTo({ top:0, behavior:"smooth" });
  }

  function resetToIntro() {
    stopTimer(); runToken=""; currentQuestion=null; currentStack=null; score=0; streak=0; pendingFinished=null; pendingLevelAdvance=null; submitting=false;
    stage.hidden=true; resultStage.hidden=true; errorStage.hidden=true; intro.hidden=false;
    window.scrollTo({top:0,behavior:"smooth"});
  }

  startBtn.addEventListener("click", startGame);
  nextBtn.addEventListener("click", goNext);
  $("#result-retry").addEventListener("click", startGame);
  $("#game-error-retry").addEventListener("click", resetToIntro);
  loadIdentity();
})();
