import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://jyfbajronywtvnrygtcu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZmJhanJvbnl3dHZucnlndGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTA1NDgsImV4cCI6MjA5NDc2NjU0OH0.f0-oRBz4mAZd4pt65ftN1gbbSF3cw1aJHWxF2VuzoHc";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const SUPER_ADMIN_EMAIL = "a0987081481@gmail.com";

const state = {
  session: null,
  profile: null,
  sites: [],
  profiles: [],
  selectedOwnerId: null,
  selectedSiteId: null,
  attachments: {
    photos: [],
    files: [],
  },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PHOTO_WIDTH = 1600;
const PHOTO_QUALITY = 0.78;
const PHOTO_EXTENSIONS = ["jpg", "jpeg", "png", "heic", "webp"];
const FILE_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "log",
  "csv",
  "json",
  "xml",
  "ini",
  "cfg",
  "conf",
  "rtf",
  "odt",
  "ods",
  "dwg",
  "dxf",
  "zip",
  "rar",
  "7z",
];

const els = {
  authView: document.querySelector('[data-view="auth"]'),
  mainView: document.querySelector('[data-view="main"]'),
  loginForm: document.querySelector("#login-form"),
  authMessage: document.querySelector("#auth-message"),
  email: document.querySelector("#email"),
  password: document.querySelector("#password"),
  logoutButton: document.querySelector("#logout-button"),
  manageUsersButton: document.querySelector("#manage-users-button"),
  profileBadge: document.querySelector("#profile-badge"),
  storageUsage: document.querySelector("#storage-usage"),
  searchInput: document.querySelector("#search-input"),
  newSiteButton: document.querySelector("#new-site-button"),
  siteList: document.querySelector("#site-list"),
  listEyebrow: document.querySelector("#list-eyebrow"),
  listTitle: document.querySelector("#list-title"),
  backToOwnersButton: document.querySelector("#back-to-owners-button"),
  emptyState: document.querySelector("#empty-state"),
  detailEmpty: document.querySelector("#detail-empty"),
  userAdmin: document.querySelector("#user-admin"),
  userForm: document.querySelector("#user-form"),
  userMessage: document.querySelector("#user-message"),
  userList: document.querySelector("#user-list"),
  closeUsersButton: document.querySelector("#close-users-button"),
  profileId: document.querySelector("#profile-id"),
  profileName: document.querySelector("#profile-name"),
  profileEmail: document.querySelector("#profile-email"),
  profilePassword: document.querySelector("#profile-password"),
  profileRole: document.querySelector("#profile-role"),
  profileActive: document.querySelector("#profile-active"),
  resetUserFormButton: document.querySelector("#reset-user-form-button"),
  siteForm: document.querySelector("#site-form"),
  siteDetail: document.querySelector("#site-detail"),
  formTitle: document.querySelector("#form-title"),
  formMessage: document.querySelector("#form-message"),
  deleteSiteButton: document.querySelector("#delete-site-button"),
  cancelEditButton: document.querySelector("#cancel-edit-button"),
  editAttachments: document.querySelector("#edit-attachments"),
  editPhotoUpload: document.querySelector("#edit-photo-upload"),
  editFileUpload: document.querySelector("#edit-file-upload"),
  editPhotoList: document.querySelector("#edit-photo-list"),
  editFileList: document.querySelector("#edit-file-list"),
  ownerSelect: document.querySelector("#site-owner-select"),
  networkSelect: document.querySelector("#site-network-select"),
  hasCar: document.querySelector("#site-has-car"),
  hasMotorcycle: document.querySelector("#site-has-motorcycle"),
  carFields: document.querySelector("#car-fields"),
  motorcycleFields: document.querySelector("#motorcycle-fields"),
  featureContactlessPayment: document.querySelector("#feature-contactless-payment"),
  featureLicensePlateRecognition: document.querySelector("#feature-license-plate-recognition"),
  featureOnlinePayment: document.querySelector("#feature-online-payment"),
  featureCashOnly: document.querySelector("#feature-cash-only"),
  featureMonthlyRentOnly: document.querySelector("#feature-monthly-rent-only"),
};

const fieldIds = {
  id: "site-id",
  name: "site-name",
  code: "site-code",
  address: "site-address",
  entrance_device_count: "site-entrance",
  exit_device_count: "site-exit",
  exit_payment_device_count: "site-exit-payment",
  payment_machine_count: "site-payment",
  pricing_computer_count: "site-pricing-computer",
  car_entrance_device_count: "site-car-entrance",
  car_exit_device_count: "site-car-exit",
  car_exit_payment_device_count: "site-car-exit-payment",
  motorcycle_entrance_device_count: "site-motorcycle-entrance",
  motorcycle_exit_device_count: "site-motorcycle-exit",
  motorcycle_exit_payment_device_count: "site-motorcycle-exit-payment",
  remarks: "site-remarks",
};

function $(id) {
  return document.querySelector(`#${id}`);
}

function show(view) {
  els.authView.classList.toggle("hidden", view !== "auth");
  els.mainView.classList.toggle("hidden", view !== "main");
}

function canEdit(site) {
  return state.profile?.role === "admin" || site.created_by === state.session?.user?.id;
}

async function loadProfile() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,name,email,role,active")
    .eq("id", state.session.user.id)
    .single();

  if (error) throw error;
  state.profile = data;
  els.profileBadge.textContent = `${data.name} · ${roleLabel(data.role)}`;
  els.manageUsersButton.classList.toggle("hidden", data.role !== "admin");
}

async function loadSites() {
  const [{ data: sites, error: sitesError }, { data: profiles, error: profilesError }] = await Promise.all([
    supabase.from("sites").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id,name,email,role,active").eq("active", true),
  ]);

  if (sitesError) throw sitesError;
  if (profilesError) throw profilesError;
  state.sites = sites || [];
  state.profiles = profiles || [];
  renderSites();
  renderStorageUsage();
}

async function renderStorageUsage() {
  const [{ data: photos, error: photosError }, { data: files, error: filesError }] = await Promise.all([
    supabase.from("site_photos").select("file_size"),
    supabase.from("site_files").select("file_size"),
  ]);

  if (photosError || filesError) {
    els.storageUsage.textContent = "容量：無法讀取";
    return;
  }

  const usedBytes = [...(photos || []), ...(files || [])].reduce(
    (sum, item) => sum + Number(item.file_size || 0),
    0
  );
  const quotaBytes = 1024 * 1024 * 1024;
  const remainingBytes = Math.max(quotaBytes - usedBytes, 0);
  const percent = Math.min((usedBytes / quotaBytes) * 100, 100);

  els.storageUsage.classList.toggle("storage-warning", percent >= 75 && percent < 90);
  els.storageUsage.classList.toggle("storage-danger", percent >= 90);
  els.storageUsage.textContent = `容量：已用 ${formatStorage(usedBytes)} / 1GB，剩餘約 ${formatStorage(
    remainingBytes
  )}（${percent.toFixed(1)}%）`;
}

function getOwnerName(ownerId) {
  const profile = state.profiles.find((item) => item.id === ownerId);
  return profile?.name || profile?.email || "未命名建立者";
}

function getOwnerGroups() {
  const groups = new Map();
  for (const site of state.sites) {
    if (!groups.has(site.created_by)) {
      groups.set(site.created_by, {
        id: site.created_by,
        name: getOwnerName(site.created_by),
        count: 0,
        updatedAt: site.updated_at,
      });
    }

    const group = groups.get(site.created_by);
    group.count += 1;
    if (new Date(site.updated_at) > new Date(group.updatedAt)) {
      group.updatedAt = site.updated_at;
    }
  }

  return [...groups.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name, "zh-Hant");
  });
}

function queryMatchesSite(site, query) {
  return [site.name, site.code]
    .filter(Boolean)
    .some((value) => normalizeText(value).includes(query));
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function filteredSites(scopeOwnerId = state.selectedOwnerId) {
  const query = els.searchInput.value.trim().toLowerCase();
  const scopedSites = scopeOwnerId
    ? state.sites.filter((site) => site.created_by === scopeOwnerId)
    : state.sites;

  if (!query) return scopedSites;
  return scopedSites.filter((site) => queryMatchesSite(site, query));
}

function renderSites() {
  const query = normalizeText(els.searchInput.value);
  const showOwnerHome = !state.selectedOwnerId && !query;
  const sites = filteredSites();
  els.siteList.innerHTML = "";

  els.backToOwnersButton.classList.toggle("hidden", !state.selectedOwnerId);
  els.listEyebrow.textContent = state.selectedOwnerId ? "建立者資料庫" : "建立者資料庫";
  els.listTitle.textContent = state.selectedOwnerId
    ? getOwnerName(state.selectedOwnerId)
    : query
      ? "搜尋全部場地"
      : "全部建立者";

  if (showOwnerHome) {
    const groups = getOwnerGroups();
    els.emptyState.classList.toggle("hidden", groups.length > 0);

    for (const group of groups) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "site-card owner-card";
      button.innerHTML = `
        <strong>${escapeHtml(group.name)}</strong>
        <span class="count">${group.count} 個場地</span>
        <span>點入後只搜尋此建立者的場地</span>
      `;
      button.addEventListener("click", () => selectOwner(group.id));
      els.siteList.append(button);
    }

    return;
  }

  els.emptyState.classList.toggle("hidden", sites.length > 0);

  for (const site of sites) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `site-card ${site.id === state.selectedSiteId ? "active" : ""}`;
    button.innerHTML = `
      <div class="site-card-top">
        <strong>${escapeHtml(site.name)}</strong>
        <span class="site-code">${escapeHtml(site.code)}</span>
      </div>
      <span><b>建立者</b>${escapeHtml(getOwnerName(site.created_by))}</span>
      <span><b>建立時間</b>${formatDateTime(site.created_at)}</span>
      <span><b>地址</b>${escapeHtml(site.address)}</span>
    `;
    button.addEventListener("click", () => selectSite(site.id));
    els.siteList.append(button);
  }
}

function selectOwner(ownerId) {
  state.selectedOwnerId = ownerId;
  state.selectedSiteId = null;
  state.attachments = { photos: [], files: [] };
  els.searchInput.value = "";
  renderSites();
  renderDetail();
}

function backToOwners() {
  state.selectedOwnerId = null;
  state.selectedSiteId = null;
  state.attachments = { photos: [], files: [] };
  els.searchInput.value = "";
  renderSites();
  renderDetail();
}

async function selectSite(id) {
  state.selectedSiteId = id;
  renderSites();
  await loadAttachments(id);
  renderDetail();
}

function renderDetail() {
  const site = state.sites.find((item) => item.id === state.selectedSiteId);
  els.userAdmin.classList.add("hidden");
  els.siteForm.classList.add("hidden");
  els.detailEmpty.classList.toggle("hidden", Boolean(site));
  els.siteDetail.classList.toggle("hidden", !site);

  if (!site) return;

  const editButton = canEdit(site)
    ? '<button id="edit-site-button" type="button">編輯場地</button>'
    : "";

  els.siteDetail.innerHTML = `
    <h2>${escapeHtml(site.name)}</h2>
    <p class="eyebrow">${escapeHtml(site.code)}</p>
    <div class="detail-actions">${editButton}</div>
    <div class="info-grid">
      ${info("場地地址", site.address)}
      ${info("建立時間", formatDateTime(site.created_at))}
      ${info("業主", site.owner_name)}
      ${info("網路架構", site.phone)}
      ${site.has_car ? info("汽車設備", `入口 ${site.car_entrance_device_count} / 出口 ${site.car_exit_device_count} / 出口支付 ${site.car_exit_payment_device_count}`, true) : ""}
      ${site.has_motorcycle ? info("機車設備", `入口 ${site.motorcycle_entrance_device_count} / 出口 ${site.motorcycle_exit_device_count} / 出口支付 ${site.motorcycle_exit_payment_device_count}`, true) : ""}
      ${info("入口設備數量", site.entrance_device_count)}
      ${info("出口設備數量", site.exit_device_count)}
      ${info("出口支付數量", site.exit_payment_device_count)}
      ${info("繳費機數量", site.payment_machine_count)}
      ${info("計價電腦數量", site.pricing_computer_count)}
      ${info("功能開通", renderFeatureList(site), true, true)}
      ${info("備註", site.remarks, true)}
    </div>
    <div class="attachments">
      <section class="attachment-section">
        <div class="attachment-head">
          <h3>照片</h3>
        </div>
        ${renderPhotos()}
      </section>
      <section class="attachment-section">
        <div class="attachment-head">
          <h3>文件</h3>
        </div>
        ${renderFiles()}
      </section>
    </div>
  `;

  document.querySelector("#edit-site-button")?.addEventListener("click", () => openForm(site));
}

function openUserAdmin() {
  if (state.profile?.role !== "admin") return;
  state.selectedSiteId = null;
  state.attachments = { photos: [], files: [] };
  els.detailEmpty.classList.add("hidden");
  els.siteDetail.classList.add("hidden");
  els.siteForm.classList.add("hidden");
  els.userAdmin.classList.remove("hidden");
  resetUserForm();
  renderUsers();
}

function closeUserAdmin() {
  els.userAdmin.classList.add("hidden");
  renderDetail();
}

function resetUserForm() {
  els.profileId.value = "";
  els.profileName.value = "";
  els.profileEmail.value = "";
  els.profilePassword.value = "";
  els.profileRole.value = "editor";
  els.profileActive.value = "true";
  els.userMessage.textContent = "";
}

function renderUsers() {
  els.userList.innerHTML = "";
  const users = state.profiles
    .filter((user) => user.email !== SUPER_ADMIN_EMAIL)
    .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));

  for (const user of users) {
    const row = document.createElement("div");
    row.className = "user-row";
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(user.name)}</strong>
        <span class="subtle">${escapeHtml(user.email)} · ${roleLabel(user.role)} · ${user.active ? "啟用" : "停用"}</span>
      </div>
      <div class="user-row-actions">
        <button class="ghost" type="button" data-edit-profile="${user.id}">編輯</button>
        <button class="icon-danger" type="button" data-delete-profile="${user.id}">移除</button>
      </div>
    `;
    els.userList.append(row);
  }

  els.userList.querySelectorAll("[data-edit-profile]").forEach((button) => {
    button.addEventListener("click", () => {
      const user = state.profiles.find((item) => item.id === button.dataset.editProfile);
      if (!user) return;
      els.profileId.value = user.id;
      els.profileName.value = user.name;
      els.profileEmail.value = user.email;
      els.profilePassword.value = "";
      els.profileRole.value = user.role;
      els.profileActive.value = String(user.active);
      els.userMessage.textContent = "";
    });
  });

  els.userList.querySelectorAll("[data-delete-profile]").forEach((button) => {
    button.addEventListener("click", () => {
      const user = state.profiles.find((item) => item.id === button.dataset.deleteProfile);
      if (!user) return;
      deleteProfile(user);
    });
  });
}

async function saveProfile(event) {
  event.preventDefault();
  els.userMessage.textContent = "";

  if (state.profile?.role !== "admin") {
    els.userMessage.textContent = "只有管理者可以新增或管理帳號。";
    return;
  }

  const id = els.profileId.value.trim();
  const payload = {
    id,
    name: els.profileName.value.trim(),
    email: els.profileEmail.value.trim(),
    password: els.profilePassword.value,
    role: els.profileRole.value,
    active: els.profileActive.value === "true",
  };

  if (!id && !payload.password) {
    els.userMessage.textContent = "新增使用者需要設定初始密碼。";
    return;
  }

  try {
    await callAdminUsers(id ? "update" : "create", payload);
    await loadSites();
    resetUserForm();
    renderUsers();
    els.userMessage.textContent = id ? "使用者已更新。" : "使用者已新增。";
  } catch (error) {
    els.userMessage.textContent = friendlyError(error);
  }
}

async function deleteProfile(user) {
  if (state.profile?.role !== "admin") {
    els.userMessage.textContent = "只有管理者可以移除帳號。";
    return;
  }

  if (user.email === SUPER_ADMIN_EMAIL) {
    els.userMessage.textContent = "最高權限帳號不能移除。";
    return;
  }

  if (user.id === state.session.user.id) {
    els.userMessage.textContent = "不能移除目前登入中的管理者帳號。";
    return;
  }

  const confirmed = window.confirm(`確定移除「${user.name}」嗎？此操作會刪除登入帳號並停用使用者資料。`);
  if (!confirmed) return;

  try {
    await callAdminUsers("delete", { id: user.id });
    await loadSites();
    resetUserForm();
    renderUsers();
    els.userMessage.textContent = "使用者已移除。";
  } catch (error) {
    els.userMessage.textContent = friendlyError(error);
  }
}

async function callAdminUsers(action, payload) {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: { action, payload },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

function getSiteFeatures(site) {
  return [
    [site.feature_contactless_payment, "無感支付"],
    [site.feature_license_plate_recognition, "強建車號"],
    [site.feature_online_payment, "線上繳費"],
    [site.feature_cash_only, "純現金"],
    [site.feature_monthly_rent_only, "純月租"],
  ]
    .filter(([enabled]) => enabled)
    .map(([, label]) => label);
}

function renderFeatureList(site) {
  const features = getSiteFeatures(site);
  if (!features.length) return "未開通";
  return `
    <div class="feature-list">
      ${features.map((feature) => `<span class="feature-pill">${escapeHtml(feature)}</span>`).join("")}
    </div>
  `;
}

function info(label, value, preline = false, raw = false) {
  const content = raw ? value : escapeHtml(value ?? "未填");
  return `
    <div class="info-item ${preline ? "span-2" : ""}">
      <b>${label}</b>
      <span class="${preline ? "preline" : ""}">${content}</span>
    </div>
  `;
}

function renderPhotos(canDelete = false) {
  if (!state.attachments.photos.length) {
    return '<p class="subtle">尚未上傳照片。</p>';
  }

  return `
    <div class="photo-grid">
      ${state.attachments.photos
        .map(
          (photo) => `
            <div class="photo-item">
              <a href="${photo.signedUrl}" target="_blank" rel="noreferrer">
                <img src="${photo.signedUrl}" alt="${escapeHtml(photo.file_name)}" />
              </a>
              ${canDelete ? `<button class="icon-danger" type="button" data-delete-kind="photos" data-delete-id="${photo.id}">刪除</button>` : ""}
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderFiles(canDelete = false) {
  if (!state.attachments.files.length) {
    return '<p class="subtle">尚未上傳文件。</p>';
  }

  return `
    <ul class="file-list">
      ${state.attachments.files
        .map(
          (file) => `
            <li>
              <a href="${file.signedUrl}" target="_blank" rel="noreferrer">${escapeHtml(file.file_name)}</a>
              <span class="subtle">${formatBytes(file.file_size)}</span>
              ${canDelete ? `<button class="icon-danger" type="button" data-delete-kind="files" data-delete-id="${file.id}">刪除</button>` : ""}
            </li>
          `
        )
        .join("")}
    </ul>
  `;
}

async function loadAttachments(siteId) {
  state.attachments = { photos: [], files: [] };

  const [{ data: photos, error: photosError }, { data: files, error: filesError }] = await Promise.all([
    supabase.from("site_photos").select("*").eq("site_id", siteId).order("created_at", { ascending: false }),
    supabase.from("site_files").select("*").eq("site_id", siteId).order("created_at", { ascending: false }),
  ]);

  if (photosError) throw photosError;
  if (filesError) throw filesError;

  state.attachments.photos = await withSignedUrls(photos || []);
  state.attachments.files = await withSignedUrls(files || []);
}

async function withSignedUrls(items) {
  return Promise.all(
    items.map(async (item) => {
      const { data } = await supabase.storage
        .from("site-attachments")
        .createSignedUrl(item.file_path, 60 * 10);

      return {
        ...item,
        signedUrl: data?.signedUrl || "#",
      };
    })
  );
}

function openForm(site = null) {
  els.detailEmpty.classList.add("hidden");
  els.siteDetail.classList.add("hidden");
  els.siteForm.classList.remove("hidden");
  els.formMessage.textContent = "";
  els.formTitle.textContent = site ? "編輯場地" : "新增場地";
  els.editAttachments.classList.toggle("hidden", !site || !canEdit(site));
  els.deleteSiteButton.classList.toggle("hidden", !site || !canEdit(site));

  const values = site || {
    id: "",
    name: "",
    code: "PSS_",
    address: "",
    owner_name: "",
    phone: "",
    has_car: false,
    car_entrance_device_count: 0,
    car_exit_device_count: 0,
    car_exit_payment_device_count: 0,
    has_motorcycle: false,
    motorcycle_entrance_device_count: 0,
    motorcycle_exit_device_count: 0,
    motorcycle_exit_payment_device_count: 0,
    entrance_device_count: 0,
    exit_device_count: 0,
    exit_payment_device_count: 0,
    payment_machine_count: 0,
    pricing_computer_count: 0,
    feature_contactless_payment: false,
    feature_license_plate_recognition: false,
    feature_online_payment: false,
    feature_cash_only: false,
    feature_monthly_rent_only: false,
    remarks: "",
  };

  els.hasCar.checked = Boolean(values.has_car);
  els.hasMotorcycle.checked = Boolean(values.has_motorcycle);
  els.featureContactlessPayment.checked = Boolean(values.feature_contactless_payment);
  els.featureLicensePlateRecognition.checked = Boolean(values.feature_license_plate_recognition);
  els.featureOnlinePayment.checked = Boolean(values.feature_online_payment);
  els.featureCashOnly.checked = Boolean(values.feature_cash_only);
  els.featureMonthlyRentOnly.checked = Boolean(values.feature_monthly_rent_only);

  for (const [key, id] of Object.entries(fieldIds)) {
    $(id).value = values[key] ?? "";
  }

  setChoiceValue(els.ownerSelect, $("site-owner"), values.owner_name, ["阜爾", "城市車旅"]);
  setChoiceValue(els.networkSelect, $("site-phone"), values.phone, ["4G網卡", "中華電信"]);
  syncVehicleFields();
  updateVehicleTotals();

  if (site && canEdit(site)) {
    els.editPhotoList.innerHTML = renderPhotos(true);
    els.editFileList.innerHTML = renderFiles(true);
    bindDeleteButtons();
  }
}

function readForm() {
  return {
    name: $("site-name").value.trim(),
    code: $("site-code").value.trim(),
    address: $("site-address").value.trim(),
    owner_name: readChoiceValue(els.ownerSelect, $("site-owner")),
    phone: readChoiceValue(els.networkSelect, $("site-phone")),
    has_car: els.hasCar.checked,
    car_entrance_device_count: els.hasCar.checked ? Number($("site-car-entrance").value || 0) : 0,
    car_exit_device_count: els.hasCar.checked ? Number($("site-car-exit").value || 0) : 0,
    car_exit_payment_device_count: els.hasCar.checked ? Number($("site-car-exit-payment").value || 0) : 0,
    has_motorcycle: els.hasMotorcycle.checked,
    motorcycle_entrance_device_count: els.hasMotorcycle.checked ? Number($("site-motorcycle-entrance").value || 0) : 0,
    motorcycle_exit_device_count: els.hasMotorcycle.checked ? Number($("site-motorcycle-exit").value || 0) : 0,
    motorcycle_exit_payment_device_count: els.hasMotorcycle.checked ? Number($("site-motorcycle-exit-payment").value || 0) : 0,
    entrance_device_count: Number($("site-entrance").value || 0),
    exit_device_count: Number($("site-exit").value || 0),
    exit_payment_device_count: Number($("site-exit-payment").value || 0),
    payment_machine_count: Number($("site-payment").value || 0),
    pricing_computer_count: Number($("site-pricing-computer").value || 0),
    feature_contactless_payment: els.featureContactlessPayment.checked,
    feature_license_plate_recognition: els.featureLicensePlateRecognition.checked,
    feature_online_payment: els.featureOnlinePayment.checked,
    feature_cash_only: els.featureCashOnly.checked,
    feature_monthly_rent_only: els.featureMonthlyRentOnly.checked,
    notes: null,
    remarks: $("site-remarks").value.trim() || null,
  };
}

function populateCountSelects() {
  [
    "site-car-entrance",
    "site-car-exit",
    "site-car-exit-payment",
    "site-motorcycle-entrance",
    "site-motorcycle-exit",
    "site-motorcycle-exit-payment",
    "site-payment",
    "site-pricing-computer",
  ].forEach((id) => {
    const select = $(id);
    if (!select || select.options.length) return;
    select.append(new Option("0", "0"));
    for (let value = 1; value <= 20; value += 1) {
      select.append(new Option(String(value), String(value)));
    }
  });
}

function syncVehicleFields() {
  els.carFields.classList.toggle("hidden", !els.hasCar.checked);
  els.motorcycleFields.classList.toggle("hidden", !els.hasMotorcycle.checked);
}

function updateVehicleTotals() {
  const carEntrance = els.hasCar.checked ? Number($("site-car-entrance").value || 0) : 0;
  const carExit = els.hasCar.checked ? Number($("site-car-exit").value || 0) : 0;
  const carExitPayment = els.hasCar.checked ? Number($("site-car-exit-payment").value || 0) : 0;
  const motorcycleEntrance = els.hasMotorcycle.checked ? Number($("site-motorcycle-entrance").value || 0) : 0;
  const motorcycleExit = els.hasMotorcycle.checked ? Number($("site-motorcycle-exit").value || 0) : 0;
  const motorcycleExitPayment = els.hasMotorcycle.checked ? Number($("site-motorcycle-exit-payment").value || 0) : 0;

  $("site-entrance").value = carEntrance + motorcycleEntrance;
  $("site-exit").value = carExit + motorcycleExit;
  $("site-exit-payment").value = carExitPayment + motorcycleExitPayment;
}

function setChoiceValue(select, input, value, options) {
  const normalized = value || "";
  if (!normalized) {
    select.value = "";
    input.value = "";
    input.classList.add("hidden");
    return;
  }

  if (options.includes(normalized)) {
    select.value = normalized;
    input.value = "";
    input.classList.add("hidden");
    return;
  }

  select.value = "__other";
  input.value = normalized;
  input.classList.remove("hidden");
}

function readChoiceValue(select, input) {
  if (select.value === "__other") {
    return input.value.trim() || null;
  }

  return select.value || null;
}

function syncOtherInput(select, input) {
  input.classList.toggle("hidden", select.value !== "__other");
  if (select.value !== "__other") {
    input.value = "";
  }
}

async function saveSite(event) {
  event.preventDefault();
  els.formMessage.textContent = "";

  const id = $("site-id").value;
  const payload = readForm();

  let result;
  if (id) {
    result = await supabase
      .from("sites")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
  } else {
    result = await supabase
      .from("sites")
      .insert({ ...payload, created_by: state.session.user.id })
      .select()
      .single();
  }

  if (result.error) {
    els.formMessage.textContent = friendlyError(result.error);
    return;
  }

  state.selectedSiteId = result.data.id;
  await loadSites();
  await loadAttachments(result.data.id);
  renderDetail();
}

async function uploadMany(site, fileList, kind) {
  const uploadMessage = document.querySelector("#upload-message");
  uploadMessage.textContent = "";

  const files = Array.from(fileList || []);
  if (!files.length) return;

  for (const file of files) {
    const validation = validateFile(file, kind);
    if (validation) {
      uploadMessage.textContent = validation;
      return;
    }
  }

  try {
    const summaries = [];
    for (const file of files) {
      const summary = await uploadOne(site, file, kind);
      if (summary) summaries.push(summary);
    }
    await loadAttachments(site.id);
    openForm(site);
    const refreshedMessage = document.querySelector("#upload-message");
    if (refreshedMessage && summaries.length) {
      refreshedMessage.textContent = summaries.join("；");
    }
  } catch (error) {
    uploadMessage.textContent = error.message;
  }
}

async function uploadOne(site, file, kind) {
  const uploadFile = kind === "photos" ? await preparePhoto(file) : file;
  const extension = getExtension(uploadFile.name);
  const fileId = crypto.randomUUID();
  const filePath = `${site.id}/${kind}/${fileId}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("site-attachments")
    .upload(filePath, uploadFile, {
      cacheControl: "3600",
      contentType: uploadFile.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const table = kind === "photos" ? "site_photos" : "site_files";
  const payload = {
    site_id: site.id,
    file_name: file.name,
    file_path: filePath,
    file_size: uploadFile.size,
    uploaded_by: state.session.user.id,
  };

  if (kind === "files") {
    payload.file_type = extension;
  }

  const { error: insertError } = await supabase.from(table).insert(payload);
  if (insertError) throw insertError;

  if (kind === "photos") {
    return `${file.name}：${formatBytes(file.size)} -> ${formatBytes(uploadFile.size)}`;
  }

  return "";
}

async function preparePhoto(file) {
  if (!file.type.startsWith("image/") || file.type.includes("heic")) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(MAX_PHOTO_WIDTH / bitmap.width, 1);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", PHOTO_QUALITY);
  });

  if (!blob || blob.size >= file.size) {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}

async function deleteAttachment(kind, id) {
  const collection = kind === "photos" ? state.attachments.photos : state.attachments.files;
  const item = collection.find((entry) => entry.id === id);
  if (!item) return;

  const confirmed = window.confirm(`確定刪除「${item.file_name}」嗎？`);
  if (!confirmed) return;

  const uploadMessage = document.querySelector("#upload-message");
  uploadMessage.textContent = "";

  const { error: storageError } = await supabase.storage
    .from("site-attachments")
    .remove([item.file_path]);

  if (storageError) {
    uploadMessage.textContent = storageError.message;
    return;
  }

  const table = kind === "photos" ? "site_photos" : "site_files";
  const { error: rowError } = await supabase.from(table).delete().eq("id", id);

  if (rowError) {
    uploadMessage.textContent = rowError.message;
    return;
  }

  await loadAttachments(state.selectedSiteId);
  const site = state.sites.find((entry) => entry.id === state.selectedSiteId);
  openForm(site);
}

async function deleteSelectedSite() {
  const site = state.sites.find((entry) => entry.id === state.selectedSiteId);
  if (!site || !canEdit(site)) return;

  const confirmed = window.confirm(`確定刪除「${site.name}」嗎？照片、文件和場地資料都會被刪除。`);
  if (!confirmed) return;

  els.formMessage.textContent = "";

  const { data: photoRows, error: photosError } = await supabase
    .from("site_photos")
    .select("file_path")
    .eq("site_id", site.id);
  const { data: fileRows, error: filesError } = await supabase
    .from("site_files")
    .select("file_path")
    .eq("site_id", site.id);

  if (photosError || filesError) {
    els.formMessage.textContent = friendlyError(photosError || filesError);
    return;
  }

  const paths = [...(photoRows || []), ...(fileRows || [])].map((item) => item.file_path);
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from("site-attachments").remove(paths);
    if (storageError) {
      els.formMessage.textContent = storageError.message;
      return;
    }
  }

  const { error: deleteError } = await supabase.from("sites").delete().eq("id", site.id);
  if (deleteError) {
    els.formMessage.textContent = friendlyError(deleteError);
    return;
  }

  state.selectedSiteId = null;
  state.attachments = { photos: [], files: [] };
  await loadSites();
  renderDetail();
}

function bindDeleteButtons() {
  els.siteForm.querySelectorAll("[data-delete-kind]").forEach((button) => {
    button.addEventListener("click", () => {
      deleteAttachment(button.dataset.deleteKind, button.dataset.deleteId);
    });
  });
}

function validateFile(file, kind) {
  if (kind !== "photos" && file.size > MAX_FILE_SIZE) {
    return `${file.name} 超過 10MB，請壓縮後再上傳。`;
  }

  const extension = getExtension(file.name);
  const allowed = kind === "photos" ? PHOTO_EXTENSIONS : FILE_EXTENSIONS;
  if (!allowed.includes(extension)) {
    return `${file.name} 的格式不支援。`;
  }

  return "";
}

function getExtension(fileName) {
  return fileName.split(".").pop().toLowerCase();
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatStorage(bytes) {
  if (!bytes) return "0 MB";
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDateTime(value) {
  if (!value) return "未記錄";
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function init() {
  populateCountSelects();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  const { data } = await supabase.auth.getSession();
  state.session = data.session;

  if (!state.session) {
    show("auth");
    return;
  }

  try {
    await loadProfile();
    await loadSites();
    show("main");
  } catch (error) {
    els.authMessage.textContent = error.message;
    await supabase.auth.signOut();
    show("auth");
  }
}

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = els.loginForm.querySelector('button[type="submit"]');
  els.authMessage.textContent = "";
  submitButton.disabled = true;
  submitButton.textContent = "登入中";

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: els.email.value.trim(),
      password: els.password.value,
    });

    if (error) throw error;

    state.session = data.session;
    await loadProfile();
    await loadSites();
    show("main");
  } catch (error) {
    els.authMessage.textContent = friendlyError(error);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "登入";
  }
});

els.logoutButton.addEventListener("click", async () => {
  await supabase.auth.signOut();
  state.session = null;
  state.profile = null;
  state.sites = [];
  state.selectedSiteId = null;
  state.selectedOwnerId = null;
  show("auth");
});

els.manageUsersButton.addEventListener("click", openUserAdmin);
els.closeUsersButton.addEventListener("click", closeUserAdmin);
els.resetUserFormButton.addEventListener("click", resetUserForm);
els.userForm.addEventListener("submit", saveProfile);
els.searchInput.addEventListener("input", renderSites);
els.backToOwnersButton.addEventListener("click", backToOwners);
els.newSiteButton.addEventListener("click", () => openForm());
els.cancelEditButton.addEventListener("click", renderDetail);
els.deleteSiteButton.addEventListener("click", deleteSelectedSite);
els.siteForm.addEventListener("submit", saveSite);
els.editPhotoUpload.addEventListener("change", (event) => {
  const site = state.sites.find((item) => item.id === state.selectedSiteId);
  if (!site) return;
  uploadMany(site, event.target.files, "photos");
  event.target.value = "";
});
els.editFileUpload.addEventListener("change", (event) => {
  const site = state.sites.find((item) => item.id === state.selectedSiteId);
  if (!site) return;
  uploadMany(site, event.target.files, "files");
  event.target.value = "";
});
els.ownerSelect.addEventListener("change", () => syncOtherInput(els.ownerSelect, $("site-owner")));
els.networkSelect.addEventListener("change", () => syncOtherInput(els.networkSelect, $("site-phone")));
els.hasCar.addEventListener("change", () => {
  syncVehicleFields();
  updateVehicleTotals();
});
els.hasMotorcycle.addEventListener("change", () => {
  syncVehicleFields();
  updateVehicleTotals();
});
[
  "site-car-entrance",
  "site-car-exit",
  "site-car-exit-payment",
  "site-motorcycle-entrance",
  "site-motorcycle-exit",
  "site-motorcycle-exit-payment",
].forEach((id) => $(id).addEventListener("change", updateVehicleTotals));

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function friendlyError(error) {
  const message = error?.message || String(error);

  if (message.includes("Invalid login credentials")) {
    return "Email 或密碼不正確。";
  }

  if (message.includes("Email not confirmed")) {
    return "這個 Email 還沒有完成驗證，請先到信箱確認。";
  }

  if (message.includes("JSON object requested") || message.includes("0 rows")) {
    return "登入成功，但 profiles 裡找不到這個使用者資料。請確認 profiles 有這個 User UID。";
  }

  if (message.includes("Failed to fetch")) {
    return "連線 Supabase 失敗，請確認 Project URL、anon key 和網路連線。";
  }

  if (message.includes("FunctionsHttpError") || message.includes("Edge Function")) {
    return "使用者管理後端尚未部署或回應錯誤，請確認 admin-users Edge Function 已部署。";
  }

  if (message.includes("row-level security") && message.includes("sites")) {
    return "目前帳號沒有新增或編輯場地權限。請確認帳號角色與場地擁有者設定。";
  }

  return message;
}

function roleLabel(role) {
  const labels = {
    admin: "管理者",
    editor: "編輯者",
    viewer: "瀏覽者",
  };
  return labels[role] || role;
}

init();
