import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  Clock,
  Calendar,
  Trash2,
  Check,
  Sun,
  Moon,
} from "lucide-react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

/* --------------------------------------------------------------
   IMAGE COMPRESSION – Reduce size before saving
   -------------------------------------------------------------- */
const compressImage = (file, callback) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Max 800px width, keep aspect ratio
      const MAX_WIDTH = 800;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = (height * MAX_WIDTH) / width;
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG with 70% quality
      canvas.toBlob(
        (blob) => {
          const compressedReader = new FileReader();
          compressedReader.onload = () => callback(compressedReader.result);
          compressedReader.readAsDataURL(blob);
        },
        "image/jpeg",
        0.7
      );
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

const GeeGraphicsSystem = () => {
  /* ------------------------------------------------------------------ *
   *  STATE
   * ------------------------------------------------------------------ */
  const [darkMode, setDarkMode] = useState(false);
  const [currentScreen, setCurrentScreen] = useState("welcome");
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Ongoing Teams");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [orders, setOrders] = useState([]);
  const [prices, setPrices] = useState({
    "T-Shirt Jersey": 250,
    "Cropped Jersey": 280,
    "Oversized Jersey": 300,
    "Basketball Jersey": 350,
    "Volleyball Jersey": 350,
    "Longsleeve Warmers Jersey": 320,
    "Polo Shirt": 290,
  });

  const [formData, setFormData] = useState({
    teamName: "",
    deadline: "",
    image: "",
    style: "",
    sizes: { XS: 0, S: 0, M: 0, L: 0, XL: 0, "2XL": 0, "3XL": 0 },
    fabric: "",
    quantity: 0,
    status: "ongoing",
    progressStage: "Design Approved",
    sizingNotes: "",
    deliveryStatus: "Pending",
    createdAt: new Date().toISOString(),
  });

  const [authForm, setAuthForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [authMode, setAuthMode] = useState("login");

  const [currentTime, setCurrentTime] = useState("");
  const [welcomeFadeOut, setWelcomeFadeOut] = useState(false);

  // new UI state
  const [username, setUsername] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // pricing UI local state (editable copy + uploaded images)
  const [tempPrices, setTempPrices] = useState(prices);
  const [pricingImages, setPricingImages] = useState({});

  // keep tempPrices in sync when prices load/change
  useEffect(() => setTempPrices(prices), [prices]);

  const handlePricingImageUpload = (key, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // reuse compressImage helper
    compressImage(file, (base64) => {
      setPricingImages((p) => ({ ...p, [key]: base64 }));
    });
  };
  /* ------------------------------------------------------------------ *
   *  CONSTANTS
   * ------------------------------------------------------------------ */
  const tabs = [
    "Ongoing Teams",
    "Status",
    "Sizing",
    "Printing",
    "Done Print",
    "To Sew",
    "To Deliver",
    "Finished",
  ];

  const shirtStyles = [
    "Cropped Jersey",
    "T-shirt Round Neck",
    "T-shirt V-Neck",
    "Sleeveless",
    "Full Set",
    "Basketball Jersey",
    "Volleyball Jersey",
    "Longsleeve",
    "Warmers",
    "Polo Shirt",
  ];

  const fabrics = [
    "Aircool",
    "Shiny",
    "Interlock",
    "Honeycomb",
    "Microfiber",
    "Eyelet",
    "Dryfit Mesh",
  ];

  const progressStages = [
    "Design Approved",
    "Change Shirt Type",
    "Color Correction",
  ];

  /* ------------------------------------------------------------------ *
   *  HELPERS – safe state setters (prevent unnecessary re-renders)
   * ------------------------------------------------------------------ */
  const safeSetOrders = useCallback((newOrders) => {
    setOrders((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(newOrders)) return prev;
      return newOrders;
    });
  }, []);

  const safeSetPrices = useCallback((newPrices) => {
    setPrices((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(newPrices)) return prev;
      return newPrices;
    });
  }, []);

  /* ------------------------------------------------------------------ *
   *  TIME TICKER
   * ------------------------------------------------------------------ */
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      setCurrentTime(
        `${
          days[now.getDay()]
        }, ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-redirect from welcome to auth after 2 seconds with fade
  useEffect(() => {
    if (currentScreen !== "welcome") return;
    setWelcomeFadeOut(false);
    const fadeTimer = setTimeout(() => setWelcomeFadeOut(true), 1600); // start fade shortly before switch
    const t = setTimeout(() => setCurrentScreen("auth"), 2000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(t);
    };
  }, [currentScreen]);

  /* --------------------------------------------------------------
     AUTH – localStorage (any username works)
     -------------------------------------------------------------- */
  const handleSignup = async () => {
    if (!authForm.username || !authForm.email || !authForm.password) {
      alert("Please fill all fields");
      return;
    }

    if (authForm.password.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        authForm.email,
        authForm.password
      );

      // Create user document in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username: authForm.username,
        email: authForm.email,
        createdAt: new Date().toISOString()
      });

      setCurrentUser(userCredential.user.uid);
      setCurrentScreen("main");
      setAuthForm({ username: "", email: "", password: "" });
    } catch (error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          alert("This email is already registered");
          break;
        case 'auth/invalid-email':
          alert("Please enter a valid email address");
          break;
        case 'auth/operation-not-allowed':
          alert("Email/password accounts are not enabled. Please contact support.");
          break;
        default:
          alert("Error creating account: " + error.message);
      }
    }
  };

  // Fix the handleLogin function
  const handleLogin = async () => {
    if (!authForm.email || !authForm.password) {
      alert("Please enter your email and password");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        authForm.email,
        authForm.password
      );

      setCurrentUser(userCredential.user.uid);
      setCurrentScreen("main");
      setAuthForm({ username: "", email: "", password: "" });
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setCurrentScreen("welcome"); // Fixed: Added parentheses
    } catch (error) {
      alert(error.message);
    }
  };

  /* --------------------------------------------------------------
     FIRESTORE DATA SYNC
     -------------------------------------------------------------- */
  // Load orders when user logs in
  useEffect(() => {
    if (!currentUser) {
      setUsername("");
      return;
    }

    // load user profile (username)
    const loadProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsername(data.username || "");
        }
      } catch (err) {
        console.error("Load profile error:", err);
      }
    };
    loadProfile();

    // Real-time orders sync
    const q = query(
      collection(db, "orders"),
      where("userId", "==", currentUser)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = [];
      snapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() });
      });
      safeSetOrders(ordersData);
    });

    // Load prices
    const loadPrices = async () => {
      const pricesDoc = await getDoc(doc(db, "prices", currentUser));
      if (pricesDoc.exists()) {
        safeSetPrices(pricesDoc.data());
      }
    };
    loadPrices();

    return () => unsubscribe();
  }, [currentUser]);

  /* --------------------------------------------------------------
     STORAGE & DATA OPERATIONS WITH FIREBASE
     -------------------------------------------------------------- */
  const createOrder = useCallback(async () => {
    try {
      const newOrder = {
        ...formData,
        userId: currentUser,
        createdAt: new Date().toISOString(),
      };

      const docRef = doc(collection(db, "orders"));
      await setDoc(docRef, newOrder);
      setShowModal(false);
    } catch (error) {
      alert("Error creating order: " + error.message);
    }
  }, [formData, currentUser]);

  const updateOrder = useCallback(async (updated) => {
    try {
      const orderRef = doc(db, "orders", updated.id);
      await updateDoc(orderRef, updated);
    } catch (error) {
      alert("Error updating order: " + error.message);
    }
  }, []);

  const deleteOrder = useCallback(async (id) => {
    if (!window.confirm("Delete this order?")) return;

    try {
      await deleteDoc(doc(db, "orders", id));
      setShowModal(false);
    } catch (error) {
      alert("Error deleting order: " + error.message);
    }
  }, []);

  const savePrices = useCallback(
    async (newPrices) => {
      try {
        await setDoc(doc(db, "prices", currentUser), newPrices);
        safeSetPrices(newPrices);
      } catch (error) {
        alert("Error saving prices: " + error.message);
      }
    },
    [currentUser, safeSetPrices]
  );

  const advanceOrder = useCallback((order, newStatus, newStage = null) => {
    const upd = { ...order, status: newStatus };
    if (newStage) upd.progressStage = newStage;
    updateOrder(upd);
    setShowModal(false);
  }, [updateOrder]);

  /* --------------------------------------------------------------
     IMAGE HANDLING WITH BASE64
     -------------------------------------------------------------- */
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData((f) => ({ ...f, image: "loading" }));

    const reader = new FileReader();
    reader.onload = (e) => {
      // Compress and convert to base64
      compressImage(file, (base64String) => {
        setFormData((f) => ({ ...f, image: base64String }));
      });
    };
    reader.readAsDataURL(file);
  };

  /* ------------------------------------------------------------------ *
   *  FILTERED ORDERS (memoised)
   * ------------------------------------------------------------------ */
  const getFilteredOrders = useMemo(() => {
    const map = {
      "Ongoing Teams": "ongoing",
      Status: "status",
      Sizing: "sizing",
      Printing: "printing",
      "Done Print": "done_print",
      "To Sew": "to_sew",
      "To Deliver": "to_deliver",
      Finished: "finished",
    };
    const status = map[activeTab] ?? "ongoing";
    return orders.filter((o) => o.status === status);
  }, [orders, activeTab]);

  /* ------------------------------------------------------------------ *
   *  MODAL HELPERS
   * ------------------------------------------------------------------ */
  const openModal = useCallback((type, team = null) => {
    setModalType(type);
    setSelectedTeam(team);
    if (team) {
      setFormData(team);
    } else {
      setFormData({
        teamName: "",
        deadline: "",
        image: "",
        style: "",
        sizes: { XS: 0, S: 0, M: 0, L: 0, XL: 0, "2XL": 0, "3XL": 0 },
        fabric: "",
        quantity: 0,
        status: "ongoing",
        progressStage: "Design Approved",
        sizingNotes: "",
        deliveryStatus: "Pending",
        createdAt: new Date().toISOString(),
      });
    }
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setModalType("");
    setSelectedTeam(null);
    setFormData((f) => ({ ...f, image: "" }));
  }, []);

  /* ------------------------------------------------------------------ *
   *  RENDER – WELCOME
   * ------------------------------------------------------------------ */
  if (currentScreen === "welcome") {
    return (
      <div
        className={`welcome-screen min-h-screen flex items-center justify-center ${welcomeFadeOut ? "fade-out" : ""}`}
      >
        <div className="flex items-center justify-center p-6">
          {/* static logo.svg from public */}
          <img src="/logo white.png" alt="GEE GRAPHICS" className="welcome-logo" />
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ *
   *  RENDER – AUTH
   * ------------------------------------------------------------------ */
  if (currentScreen === "auth") {
    return (
      <div
        className="auth-screen min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: "#960000" }}
      >
        {/* animated background blobs */}
        <div className="auth-blob auth-blob--one" aria-hidden />
        <div className="auth-blob auth-blob--two" aria-hidden />
        <div className="auth-blob auth-blob--three" aria-hidden />

        <div
          className="glass-card w-full max-w-md p-8 rounded-2xl relative z-10"
          role="dialog"
          aria-label="Authentication"
        >
          <h2
            className="text-3xl font-bold text-center mb-6 text-white"
            style={{ letterSpacing: ".6px" }}
          >
            {authMode === "login" ? "Login" : "Create Account"}
          </h2>

          <div className="space-y-4">
            {authMode === "signup" && (  // Only show username field for signup
              <input
                type="text"
                placeholder="Username"
                value={authForm.username}
                onChange={(e) =>
                  setAuthForm({ ...authForm, username: e.target.value })
                }
                className="glass-input"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              className="glass-input"
            />
            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(e) =>
                setAuthForm({ ...authForm, password: e.target.value })
              }
              className="glass-input"
            />


            <button
              onClick={authMode === "login" ? handleLogin : handleSignup}
              className="w-full py-3 rounded-lg font-semibold glass-cta"
              // ensure button text uses red color in CSS; keep semantic text inside
            >
              {authMode === "login" ? "Login" : "Sign Up"}
            </button>
          </div>

          <p className="text-center mt-4 text-sm text-white/85">
            {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
              className="font-semibold underline text-white/95 ml-1 underline-white"
            >
              {authMode === "login" ? "Sign Up" : "Login"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ *
   *  RENDER – PRICING SCREEN (restored -> redesigned as cards with upload)
   * ------------------------------------------------------------------ */
  if (currentScreen === "pricing") {
    return (
      <div className={`min-h-screen ${darkMode ? "dark-mode" : "light-mode"}`}>
        <div className="header-bar">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <button
                onClick={() => setCurrentScreen("main")}
                className="chip"
                aria-label="Back"
              >
                ← Back
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <img
                src={darkMode ? "/logo white.png" : "/logo.svg"}
                alt="GEE GRAPHICS"
                className="header-logo"
              />
            </div>

            <div />
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          <h2 className="text-2xl font-semibold mb-6" style={{ color: darkMode ? "#fff" : "#000" }}>
            Pricing
          </h2>

          <div className="pricing-grid">
            {Object.entries(tempPrices).map(([key, value]) => (
              <div key={key} className={`pricing-card ${darkMode ? "pricing-card--dark" : "pricing-card--light"}`}>
                <div className="pricing-media">
                  {pricingImages[key] ? (
                    <img src={pricingImages[key]} alt={key} className="pricing-img" />
                  ) : (
                    <div className="pricing-placeholder">No image</div>
                  )}

                  <div className="pricing-gradient" aria-hidden>
                    <div className="pricing-top">
                      <div className="pricing-top-left">{key}</div>
                      <div className="pricing-top-right">₱{value}</div>
                    </div>
                  </div>
                </div>

                <div className="pricing-body">
                  <div className="flex items-center justify-between w-full">
                    <div className="text-sm font-medium" style={{ color: darkMode ? "#fff" : "#000" }}>{key}</div>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) =>
                        setTempPrices((p) => ({ ...p, [key]: Number(e.target.value) || 0 }))
                      }
                      className={`pricing-input ${darkMode ? "pricing-input--dark" : "pricing-input--light"}`}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <label className="file-upload-label">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePricingImageUpload(key, e)}
                        className="hidden"
                      />
                      <span className="upload-btn">Upload image</span>
                    </label>
                    <div className="text-sm muted">{pricingImages[key] ? "Image ready" : "No image"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => savePrices(tempPrices)}
              className="btn-red"
            >
              Save
            </button>
            <button
              onClick={() => {
                setTempPrices(prices);
                setCurrentScreen("main");
              }}
              className="btn-cancel"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ *
   *  MAIN DASHBOARD (everything after the early returns)
   * ------------------------------------------------------------------ */
  const filteredOrders = getFilteredOrders;

  // helper to format deadline as "NOV 18"
  const formatDeadline = (dateLike) => {
    if (!dateLike) return "";
    const dt = new Date(dateLike);
    if (isNaN(dt)) return "";
    const month = dt.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const day = dt.getDate();
    return `${month} ${day}`;
  };

  return (
    <div
      className={`min-h-screen ${darkMode ? "dark-mode" : "light-mode"}`}
    >
      {/* ---------- HEADER ---------- */}
      <div className={`header-bar`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* left: BIG logo (day = logo.svg, dark = logo white.png) */}
          <div className="flex items-center gap-3">
            <img
              src={darkMode ? "/logo white.png" : "/logo.svg"}
              alt="GEE GRAPHICS"
              className={`header-logo header-logo--large ${darkMode ? "logo-center-dark" : "logo-left-day"}`}
            />
          </div>

          {/* center: time & date (placed in center as requested) */}
          <div className="flex-1 flex items-center justify-center">
            <div className={`flex items-center gap-2 text-sm ${darkMode ? "text-white" : "text-black"}`}>
              <Clock className="w-4 h-4" style={{ color: darkMode ? "#fff" : "#000" }} />
              <span className={darkMode ? "text-white" : "text-black"}>{currentTime}</span>
            </div>
          </div>

          {/* right: pricing chip, dark toggle, logout */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentScreen("pricing")}
              className={`chip pricing-chip ${darkMode ? "chip-dark" : "chip-day"}`}
              title="Pricing"
            >
              Pricing
            </button>

            <button
              onClick={() => setDarkMode((d) => !d)}
              className="icon-toggle"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {/* show Sun in day mode (black) and Moon in dark mode (white) */}
              {!darkMode ? <Sun className="w-5 h-5" style={{ color: "#000" }} /> : <Moon className="w-5 h-5" style={{ color: "#fff" }} />}
            </button>

            {/* logout (opens confirmation modal) - use non-bold logout class */}
            {currentUser && (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="ml-2 btn-logout"
                title="Logout"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ---------- TAB NAV (centered chips) ---------- */}
      <div className="tabs-row py-3">
        <div className="container mx-auto px-6 flex items-center justify-center gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-chip ${activeTab === tab ? "tab-chip--active" : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- CONTENT ---------- */}
      <div className="container mx-auto px-6 py-8">
        {/* Ongoing Teams */}
        {activeTab === "Ongoing Teams" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Add new */}
            <button
              onClick={() => openModal("create")}
              className={`aspect-square rounded-xl flex items-center justify-center transition hover:scale-105 add-card ${darkMode ? "add-card--dark" : "add-card--day"}`}
            >
              <div className="text-center">
                <Plus
                  className="w-12 h-12 mx-auto mb-2"
                  style={{ color: darkMode ? "#ffffff" : "#960000" }}
                />
                <p className="font-semibold" style={{ color: darkMode ? "#fff" : "#000" }}>Add New Team</p>
              </div>
            </button>

            {/* Cards */}
            {filteredOrders.map((order) => (
              <button
                key={order.id}
                onClick={() => openModal("view", order)}
                className={`aspect-square rounded-xl overflow-hidden relative group transition hover:scale-105 team-card`}
                style={{
                  backgroundImage: order.image ? `url(${order.image})` : "none",
                  backgroundColor: order.image
                    ? "transparent"
                    : darkMode
                    ? "#960000"
                    : "#f3f4f6",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-0 right-0 text-center text-white font-bold text-lg px-2">
                  {order.teamName}
                </div>

                <div className="absolute top-4 right-4">
                  <div className={`chip deadline-chip`}>
                    {formatDeadline(order.deadline)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Status Tab */}
        {activeTab === "Status" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <button
                key={order.id}
                onClick={() => openModal("status", order)}
                className={`p-6 rounded-xl border-2 text-left transition hover:scale-105 hover:shadow-lg ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <h3 className="text-xl font-bold mb-2">{order.teamName}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4" style={{ color: "#960000" }} />
                  <span className="text-sm">
                    {new Date(order.deadline).toLocaleDateString()}
                  </span>
                </div>
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: "#960000",
                      width: `${
                        ((progressStages.indexOf(order.progressStage) + 1) /
                          progressStages.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "#960000" }}
                >
                  {order.progressStage}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Sizing Tab */}
        {activeTab === "Sizing" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredOrders.map((order) => (
              <button
                key={order.id}
                onClick={() => openModal("sizing", order)}
                className={`p-6 rounded-xl border-2 text-left transition hover:scale-105 hover:shadow-lg ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <h3 className="text-xl font-bold">{order.teamName}</h3>
                <p className="text-sm mt-2 opacity-60">Click to manage sizes</p>
              </button>
            ))}
          </div>
        )}

        {/* Printing / Done Print / To Sew / To Deliver */}
        {["Printing", "Done Print", "To Sew", "To Deliver"].includes(
          activeTab
        ) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <button
                key={order.id}
                onClick={() => openModal("progress", order)}
                className={`p-6 rounded-xl border-2 text-left transition hover:scale-105 hover:shadow-lg ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                {order.image && (
                  <img
                    src={order.image}
                    alt={order.teamName}
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                )}
                <h3 className="text-xl font-bold mb-2">{order.teamName}</h3>
                <p className="text-sm opacity-60">{order.style}</p>
                <p className="text-sm opacity-60 mt-1">Qty: {order.quantity}</p>
              </button>
            ))}
          </div>
        )}

        {/* Finished Tab */}
        {activeTab === "Finished" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`p-6 rounded-xl border-2 shadow-lg ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex gap-4">
                  {order.image && (
                    <img
                      src={order.image}
                      alt={order.teamName}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">
                      {order.teamName}
                    </h3>
                    <p className="mb-1">
                      <strong>Style:</strong> {order.style}
                    </p>
                    <p className="mb-1">
                      <strong>Fabric:</strong> {order.fabric}
                    </p>
                    <p className="mb-1">
                      <strong>Quantity:</strong> {order.quantity}
                    </p>
                    <p className="mb-1">
                      <strong>Completed:</strong>{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------- MODAL ---------- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl p-6 shadow-2xl ${
              darkMode
                ? "bg-[#5a0000] border border-[#7a0000]"
                : "bg-white border border-gray-200"
            }`}
          >
            {/* CREATE / VIEW */}
            {(modalType === "create" || modalType === "view") && (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    {modalType === "create" ? (
                      <input
                        type="text"
                        placeholder="Team Name"
                        value={formData.teamName}
                        onChange={(e) =>
                          setFormData({ ...formData, teamName: e.target.value })
                        }
                        className={`text-2xl font-bold w-full px-2 py-1 rounded transition focus:outline-none ${
                          darkMode
                            ? "bg-gray-700 text-white"
                            : "bg-gray-100 text-black"
                        }`}
                      />
                    ) : (
                      <h2 className="text-2xl font-bold">
                        {selectedTeam?.teamName}
                      </h2>
                    )}
                  </div>
                  <button
                    onClick={closeModal}
                    className="hover:scale-110 transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {modalType === "create" ? (
                  <div className="space-y-4">
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) =>
                        setFormData({ ...formData, deadline: e.target.value })
                      }
                      className={`w-full px-4 py-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        darkMode
                          ? "bg-red-form border-black text-white"
                          : "bg-white border-gray-300 text-black"
                      }`}
                    />

                    {/* Image upload */}
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="img-upload"
                      />
                      <label
                        htmlFor="img-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Plus className="w-8 h-8 text-gray-400" />
                        <span
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {formData.image ? "Image selected" : "Upload Mockup"}
                        </span>
                      </label>
                    </div>
                    {formData.image && formData.image !== "loading" ? (
                      <img
                        src={formData.image}
                        alt="preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : formData.image === "loading" ? (
                      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <div className="text-sm">Compressing image...</div>
                      </div>
                    ) : null}

                    <select
                      value={formData.style}
                      onChange={(e) =>
                        setFormData({ ...formData, style: e.target.value })
                      }
                      className={`w-full px-4 py-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-gray-100 border-gray-300 text-black"
                      }`}
                    >
                      <option value="">Select Style</option>
                      {shirtStyles.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>

                    <select
                      value={formData.fabric}
                      onChange={(e) =>
                        setFormData({ ...formData, fabric: e.target.value })
                      }
                      className={`w-full px-4 py-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-gray-100 border-gray-300 text-black"
                      }`}
                    >
                      <option value="">Select Fabric</option>
                      {fabrics.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>

                    {/* Sizes */}
                    <div>
                      <h4 className="font-semibold mb-2">Sizes:</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {Object.keys(formData.sizes).map((sz) => (
                          <div key={sz}>
                            <label className="text-sm block mb-1">{sz}</label>
                            <input
                              type="number"
                              min="0"
                              value={formData.sizes[sz]}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  sizes: {
                                    ...formData.sizes,
                                    [sz]: parseInt(e.target.value) || 0,
                                  },
                                })
                              }
                              className={`w-full px-2 py-1 rounded transition focus:outline-none focus:ring-1 ${
                                darkMode
                                  ? "bg-gray-700 text-white"
                                  : "bg-gray-100 text-black"
                              }`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <input
                      type="number"
                      placeholder="Total Quantity"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quantity: parseInt(e.target.value) || 0,
                        })
                      }
                      className={`w-full px-4 py-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-gray-100 border-gray-300 text-black"
                      }`}
                    />

                    <button
                      onClick={createOrder}
                      className="w-full py-3 rounded-lg font-semibold btn-red"
                    >
                      Create Order
                    </button>
                  </div>
                ) : (
                  /* VIEW */
                  <>
                    <div className="text-right mb-4">
                      <span className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                        Deadline:{" "}
                        {new Date(selectedTeam.deadline).toLocaleDateString()}
                      </span>
                    </div>

                    {selectedTeam.image && (
                      <img
                        src={selectedTeam.image}
                        alt={selectedTeam.teamName}
                        className="w-full h-64 object-cover rounded-lg mb-4"
                      />
                    )}

                    <div className="space-y-3 mb-6">
                      <p>
                        <strong>Style:</strong> {selectedTeam.style}
                      </p>
                      <p>
                        <strong>Fabric:</strong> {selectedTeam.fabric}
                      </p>
                      <p>
                        <strong>Quantity:</strong> {selectedTeam.quantity}
                      </p>
                      <div>
                        <strong>Sizes:</strong>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Object.entries(selectedTeam.sizes).map(
                            ([sz, qty]) =>
                              qty > 0 && (
                                <span
                                  key={sz}
                                  className="px-3 py-1 rounded-full text-sm font-semibold"
                                  style={{
                                    backgroundColor: "#960000",
                                    color: "white",
                                  }}
                                >
                                  {sz}: {qty}
                                </span>
                              )
                          )}
                        </div>
                      </div>
                      <p className="text-sm opacity-60">
                        Added:{" "}
                        {new Date(selectedTeam.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => advanceOrder(selectedTeam, "status")}
                        className="flex-1 py-3 rounded-lg font-semibold btn-red"
                      >
                        Start Progress
                      </button>
                      <button
                        onClick={() => deleteOrder(selectedTeam.id)}
                        className="px-6 py-3 rounded-lg font-semibold btn-cancel"
                      >
                        Remove
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* STATUS MODAL - make stages checkable to update progress */}
            {modalType === "status" && selectedTeam && (
              <>
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold">
                    {selectedTeam.teamName}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="hover:scale-110 transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-4">Progress Tracker</h3>
                  <div className="space-y-3">
                    {progressStages.map((stage) => {
                      const checked = selectedTeam.progressStage === stage;
                      return (
                        <label
                          key={stage}
                          className={`flex items-center gap-3 p-4 rounded-lg transition-all cursor-pointer ${
                            checked
                              ? "bg-red-100 dark:bg-red-900/30 border-2 border-red-500"
                              : darkMode
                              ? "bg-gray-700"
                              : "bg-gray-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={async () => {
                              // update locally for immediate feedback
                              const updated = { ...selectedTeam, progressStage: stage };
                              setSelectedTeam(updated);
                              try {
                                await updateOrder(updated);
                              } catch (err) {
                                console.error("Error updating stage:", err);
                                // revert if needed (simple approach)
                              }
                            }}
                          />
                          <span className="font-semibold">{stage}</span>
                          {checked && (
                            <Check
                              className="w-5 h-5 ml-auto"
                              style={{ color: "#960000" }}
                            />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <p>
                    <strong>Style:</strong> {selectedTeam.style}
                  </p>
                  <p>
                    <strong>Fabric:</strong> {selectedTeam.fabric}
                  </p>
                  <p>
                    <strong>Quantity:</strong> {selectedTeam.quantity}
                  </p>
                </div>

                <div className="flex gap-3">
                  {progressStages.indexOf(selectedTeam.progressStage) > 0 && (
                    <button
                      onClick={() => {
                        const idx = progressStages.indexOf(
                          selectedTeam.progressStage
                        );
                        updateOrder({
                          ...selectedTeam,
                          progressStage: progressStages[idx - 1],
                        });
                      }}
                      className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold btn-cancel"
                    >
                      <ChevronLeft className="w-5 h-5" /> Back
                    </button>
                  )}

                  {progressStages.indexOf(selectedTeam.progressStage) <
                  progressStages.length - 1 ? (
                    <button
                      onClick={() => {
                        const idx = progressStages.indexOf(
                          selectedTeam.progressStage
                        );
                        updateOrder({
                          ...selectedTeam,
                          progressStage: progressStages[idx + 1],
                        });
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition hover:scale-105 btn-red"
                    >
                      Advance <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => advanceOrder(selectedTeam, "sizing")}
                      className="flex-1 py-3 rounded-lg font-semibold btn-red"
                    >
                      Move to Sizing
                    </button>
                  )}
                </div>
              </>
            )}

            {/* SIZING MODAL */}
            {modalType === "sizing" && selectedTeam && (
              <>
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold">
                    {selectedTeam.teamName}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="hover:scale-110 transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-2">
                    Current Size Breakdown:
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(selectedTeam.sizes).map(
                      ([sz, qty]) =>
                        qty > 0 && (
                          <span
                            key={sz}
                            className="px-3 py-1 rounded-full text-sm font-semibold"
                            style={{
                              backgroundColor: "#960000",
                              color: "white",
                            }}
                          >
                            {sz}: {qty}
                          </span>
                        )
                    )}
                  </div>

                  <h3 className="font-semibold mb-2">
                    Player-Specific Sizing:
                  </h3>
                  <textarea
                    value={
                      formData.sizingNotes || selectedTeam.sizingNotes || ""
                    }
                    onChange={(e) =>
                      setFormData({ ...formData, sizingNotes: e.target.value })
                    }
                    placeholder="e.g., Juan - L, Marco - XL, Ken - M"
                    rows={6}
                    className={`w-full px-4 py-3 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      darkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-100 text-black"
                    }`}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      updateOrder({
                        ...selectedTeam,
                        sizingNotes: formData.sizingNotes,
                      });
                      closeModal();
                    }}
                    className="flex-1 py-3 rounded-lg font-semibold btn-red"
                  >
                    Save & Update
                  </button>
                  <button
                    onClick={() => {
                      updateOrder({
                        ...selectedTeam,
                        sizingNotes: formData.sizingNotes,
                        status: "printing",
                      });
                      closeModal();
                    }}
                    className="flex-1 py-3 rounded-lg font-semibold btn-red"
                  >
                    Next Step
                  </button>
                  <button
                    onClick={() => deleteOrder(selectedTeam.id)}
                    className="px-6 py-3 rounded-lg font-semibold btn-cancel"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}

            {/* PROGRESS MODAL (Printing / Done Print / To Sew / To Deliver) */}
            {modalType === "progress" && selectedTeam && (
              <>
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold">
                    {selectedTeam.teamName}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="hover:scale-110 transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {selectedTeam.image && (
                  <img
                    src={selectedTeam.image}
                    alt={selectedTeam.teamName}
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                )}

                <div className="space-y-3 mb-6">
                  <p>
                    <strong>Style:</strong> {selectedTeam.style}
                  </p>
                  <p>
                    <strong>Fabric:</strong> {selectedTeam.fabric}
                  </p>
                  <p>
                    <strong>Quantity:</strong> {selectedTeam.quantity}
                  </p>
                  <div>
                    <strong>Sizes:</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(selectedTeam.sizes).map(
                        ([sz, qty]) =>
                          qty > 0 && (
                            <span
                              key={sz}
                              className="px-3 py-1 rounded-full text-sm font-semibold"
                              style={{
                                backgroundColor: "#960000",
                                color: "white",
                              }}
                            >
                              {sz}: {qty}
                            </span>
                          )
                      )}
                    </div>
                  </div>
                  {selectedTeam.sizingNotes && (
                    <div>
                      <strong>Sizing Notes:</strong>
                      <p
                        className={`mt-2 p-3 rounded-lg ${
                          darkMode ? "bg-gray-700" : "bg-gray-100"
                        }`}
                      >
                        {selectedTeam.sizingNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Buttons per tab */}
                {activeTab === "Printing" && (
                  <button
                    onClick={() => advanceOrder(selectedTeam, "done_print")}
                    className="w-full py-3 rounded-lg font-semibold transition hover:scale-105"
                    style={{ backgroundColor: "#960000", color: "white" }}
                  >
                    Mark as Done
                  </button>
                )}
                {activeTab === "Done Print" && (
                  <button
                    onClick={() => advanceOrder(selectedTeam, "to_sew")}
                    className="w-full py-3 rounded-lg font-semibold transition hover:scale-105"
                    style={{ backgroundColor: "#960000", color: "white" }}
                  >
                    Send to Sew
                  </button>
                )}
                {activeTab === "To Sew" && (
                  <button
                    onClick={() => advanceOrder(selectedTeam, "to_deliver")}
                    className="w-full py-3 rounded-lg font-semibold transition hover:scale-105"
                    style={{ backgroundColor: "#960000", color: "white" }}
                  >
                    Mark as Sewn
                  </button>
                )}
                {activeTab === "To Deliver" && (
                  <>
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Delivery Status:</h3>
                      <select
                        value={
                          formData.deliveryStatus || selectedTeam.deliveryStatus
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deliveryStatus: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-red-500 ${
                          darkMode
                            ? "bg-gray-700 text-white"
                            : "bg-gray-100 text-black"
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Out for Delivery">
                          Out for Delivery
                        </option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          updateOrder({
                            ...selectedTeam,
                            deliveryStatus: formData.deliveryStatus,
                          });
                          closeModal();
                        }}
                        className={`flex-1 py-3 rounded-lg font-semibold transition hover:scale-105 ${
                          darkMode
                            ? "bg-gray-700 text-white"
                            : "bg-gray-200 text-black"
                        }`}
                      >
                        Update Status
                      </button>

                      {(formData.deliveryStatus === "Delivered" ||
                        selectedTeam.deliveryStatus === "Delivered") && (
                        <button
                          onClick={() => advanceOrder(selectedTeam, "finished")}
                          className="flex-1 py-3 rounded-lg font-semibold transition hover:scale-105"
                          style={{ backgroundColor: "#960000", color: "white" }}
                        >
                          Complete Order
                        </button>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Logout confirmation modal (restored) */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="logout-modal w-80 h-80 p-6 rounded-lg glass-card text-center flex flex-col items-center justify-between">
            <h3 className="text-xl font-semibold mb-2 text-white">Are you sure you want to logout?</h3>
            <div className="w-full flex gap-3 justify-center">
              <button
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await handleLogout();
                }}
                className="px-4 py-2 rounded-lg font-medium btn-red logout-btn-equal"
              >
                Yes
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-lg font-medium btn-cancel logout-btn-equal"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeeGraphicsSystem;
