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
} from "lucide-react";

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

  /* --------------------------------------------------------------
   STORAGE – Use localStorage (WORKS EVERYWHERE)
   -------------------------------------------------------------- */
  const loadUserData = useCallback(() => {
    if (!currentUser) return;

    const savedOrders = localStorage.getItem(`orders_${currentUser}`);
    if (savedOrders) {
      safeSetOrders(JSON.parse(savedOrders));
    }

    const savedPrices = localStorage.getItem(`prices_${currentUser}`);
    if (savedPrices) {
      safeSetPrices(JSON.parse(savedPrices));
    }
  }, [currentUser, safeSetOrders, safeSetPrices]);

  const saveOrders = useCallback(
    async (newOrders) => {
      if (!currentUser) return;
      localStorage.setItem(`orders_${currentUser}`, JSON.stringify(newOrders));
      safeSetOrders(newOrders);
    },
    [currentUser, safeSetOrders]
  );

  const savePrices = useCallback(
    async (newPrices) => {
      if (!currentUser) return;
      localStorage.setItem(`prices_${currentUser}`, JSON.stringify(newPrices));
      safeSetPrices(newPrices);
    },
    [currentUser, safeSetPrices]
  );

  // Load data when user logs in
  useEffect(() => {
    if (currentUser) loadUserData();
  }, [currentUser, loadUserData]);

  /* --------------------------------------------------------------
     AUTH – localStorage (any username works)
     -------------------------------------------------------------- */
  const handleSignup = async () => {
    if (!authForm.username || !authForm.password) {
      alert("Please fill username and password");
      return;
    }

    const existingUser = localStorage.getItem(`user_${authForm.username}`);
    if (existingUser) {
      alert("Username already exists");
      return;
    }

    localStorage.setItem(
      `user_${authForm.username}`,
      JSON.stringify({
        username: authForm.username,
        email: authForm.email,
        password: authForm.password,
      })
    );

    setCurrentUser(authForm.username);
    setCurrentScreen("main");
    setAuthForm({ username: "", email: "", password: "" });
  };

  const handleLogin = async () => {
    if (!authForm.username || !authForm.password) {
      alert("Please fill username and password");
      return;
    }

    const userData = localStorage.getItem(`user_${authForm.username}`);
    if (!userData) {
      alert("User not found");
      return;
    }

    const user = JSON.parse(userData);
    if (user.password !== authForm.password) {
      alert("Incorrect password");
      return;
    }

    setCurrentUser(authForm.username);
    setCurrentScreen("main");
    setAuthForm({ username: "", email: "", password: "" });
  };
  /* ------------------------------------------------------------------ *
   *  IMAGE UPLOAD
   * ------------------------------------------------------------------ */
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show loading state
    setFormData((f) => ({ ...f, image: "loading" }));

    compressImage(file, (compressedDataUrl) => {
      setFormData((f) => ({ ...f, image: compressedDataUrl }));
    });
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
   *  CRUD
   * ------------------------------------------------------------------ */
  const createOrder = useCallback(() => {
    const newOrder = {
      ...formData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    saveOrders([...orders, newOrder]); // Now works!
    setShowModal(false);
  }, [formData, orders, saveOrders]);

  const updateOrder = useCallback(
    (updated) => {
      const newOrders = orders.map((o) => (o.id === updated.id ? updated : o));
      saveOrders(newOrders);
    },
    [orders]
  );

  const deleteOrder = useCallback(
    (id) => {
      if (!window.confirm("Delete this order?")) return;
      saveOrders(orders.filter((o) => o.id !== id));
      setShowModal(false);
    },
    [orders]
  );

  const advanceOrder = useCallback(
    (order, newStatus, newStage = null) => {
      const upd = { ...order, status: newStatus };
      if (newStage) upd.progressStage = newStage;
      updateOrder(upd);
      setShowModal(false);
    },
    [updateOrder]
  );

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
        className={`min-h-screen flex items-center justify-center ${
          darkMode ? "bg-gray-900" : "bg-white"
        }`}
      >
        <div className="text-center">
          <h1 className="text-6xl font-bold" style={{ color: "#960000" }}>
            GEE GRAPHICS
          </h1>
          <p
            className={`mt-4 text-xl ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Order Management System
          </p>
          <button
            onClick={() => setCurrentScreen("auth")}
            className="mt-8 px-8 py-3 rounded-lg font-semibold transition hover:scale-105"
            style={{ backgroundColor: "#960000", color: "white" }}
          >
            Get Started
          </button>
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
        className={`min-h-screen flex items-center justify-center ${
          darkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div
          className={`w-full max-w-md p-8 rounded-xl shadow-lg ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h2
            className="text-3xl font-bold text-center mb-6"
            style={{ color: "#960000" }}
          >
            {authMode === "login" ? "Login" : "Create Account"}
          </h2>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={authForm.username}
              onChange={(e) =>
                setAuthForm({ ...authForm, username: e.target.value })
              }
              className={`w-full px-4 py-3 rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-red-500 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300"
              }`}
            />
            {authMode === "signup" && (
              <input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(e) =>
                  setAuthForm({ ...authForm, email: e.target.value })
                }
                className={`w-full px-4 py-3 rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                }`}
              />
            )}
            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(e) =>
                setAuthForm({ ...authForm, password: e.target.value })
              }
              className={`w-full px-4 py-3 rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-red-500 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300"
              }`}
            />
            <button
              onClick={authMode === "login" ? handleLogin : handleSignup}
              className="w-full py-3 rounded-lg font-semibold transition hover:scale-105"
              style={{ backgroundColor: "#960000", color: "white" }}
            >
              {authMode === "login" ? "Login" : "Sign Up"}
            </button>
          </div>

          <p
            className={`text-center mt-4 ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {authMode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              onClick={() =>
                setAuthMode(authMode === "login" ? "signup" : "login")
              }
              className="font-semibold hover:underline"
              style={{ color: "#960000" }}
            >
              {authMode === "login" ? "Sign Up" : "Login"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ *
   *  RENDER – PRICING
   * ------------------------------------------------------------------ */
  if (currentScreen === "pricing") {
    return (
      <div
        className={`min-h-screen ${
          darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"
        }`}
      >
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold" style={{ color: "#960000" }}>
              Pricing
            </h1>
            <button
              onClick={() => setCurrentScreen("main")}
              className="px-6 py-2 rounded-lg font-semibold transition hover:scale-105"
              style={{ backgroundColor: "#960000", color: "white" }}
            >
              Back to Dashboard
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(prices).map(([item, price]) => (
              <div
                key={item}
                className={`p-6 rounded-xl border-2 transition hover:scale-105 hover:shadow-lg ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <h3 className="text-xl font-bold mb-4">{item}</h3>
                <div className="flex items-center gap-2">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: "#960000" }}
                  >
                    ₱
                  </span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => {
                      const np = {
                        ...prices,
                        [item]: parseInt(e.target.value) || 0,
                      };
                      savePrices(np);
                    }}
                    className={`text-2xl font-bold w-full px-2 py-1 rounded transition focus:outline-none ${
                      darkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-100 text-black"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ *
   *  MAIN DASHBOARD (everything after the early returns)
   * ------------------------------------------------------------------ */
  const filteredOrders = getFilteredOrders;

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"
      }`}
    >
      {/* ---------- HEADER ---------- */}
      <div
        className={`border-b ${
          darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
        }`}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold" style={{ color: "#960000" }}>
              GEE GRAPHICS
            </h1>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>{currentTime}</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentScreen("pricing")}
                className="px-6 py-2 rounded-lg font-semibold transition hover:scale-105"
                style={{ backgroundColor: "#960000", color: "white" }}
              >
                Pricing
              </button>

              <button
                onClick={() => setDarkMode((d) => !d)}
                className="px-4 py-2 rounded-lg transition hover:scale-105"
                style={{ backgroundColor: "#960000", color: "white" }}
              >
                {darkMode ? "Sun" : "Moon"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- TAB NAV ---------- */}
      <div
        className={`border-b ${
          darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold whitespace-nowrap transition hover:scale-105 ${
                  activeTab === tab ? "border-b-2" : ""
                } ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                style={
                  activeTab === tab
                    ? { borderColor: "#960000", color: "#960000" }
                    : {}
                }
              >
                {tab}
              </button>
            ))}
          </div>
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
              className={`aspect-square rounded-xl border-2 border-dashed flex items-center justify-center transition hover:scale-105 ${
                darkMode
                  ? "border-gray-600 hover:border-gray-400 bg-gray-800"
                  : "border-gray-300 hover:border-gray-500 bg-white"
              }`}
            >
              <div className="text-center">
                <Plus
                  className="w-12 h-12 mx-auto mb-2"
                  style={{ color: "#960000" }}
                />
                <p className="font-semibold">Add New Team</p>
              </div>
            </button>

            {/* Cards */}
            {filteredOrders.map((order) => (
              <button
                key={order.id}
                onClick={() => openModal("view", order)}
                className="aspect-square rounded-xl overflow-hidden relative group transition hover:scale-105 border-2 border-white shadow-lg"
                style={{
                  backgroundImage: order.image ? `url(${order.image})` : "none",
                  backgroundColor: order.image
                    ? "transparent"
                    : darkMode
                    ? "#1f2937"
                    : "#f3f4f6",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-0 right-0 text-center text-white font-bold text-lg px-2">
                  {order.teamName}
                </div>
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {new Date(order.deadline).toLocaleDateString()}
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
                ? "bg-gray-800 border border-gray-700"
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
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-gray-100 border-gray-300 text-black"
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
                          {formData.image ? "Image selected" : "Upload logo"}
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
                      className="w-full py-3 rounded-lg font-semibold transition hover:scale-105"
                      style={{ backgroundColor: "#960000", color: "white" }}
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
                        className="flex-1 py-3 rounded-lg font-semibold transition hover:scale-105"
                        style={{ backgroundColor: "#960000", color: "white" }}
                      >
                        Start Progress
                      </button>
                      <button
                        onClick={() => deleteOrder(selectedTeam.id)}
                        className={`px-6 py-3 rounded-lg font-semibold transition hover:scale-105 ${
                          darkMode
                            ? "bg-gray-700 text-white"
                            : "bg-gray-200 text-black"
                        }`}
                      >
                        Remove
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* STATUS MODAL */}
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
                    {progressStages.map((stage) => (
                      <div
                        key={stage}
                        className={`p-4 rounded-lg flex items-center justify-between transition-all ${
                          selectedTeam.progressStage === stage
                            ? "bg-red-100 dark:bg-red-900/30 border-2 border-red-500"
                            : darkMode
                            ? "bg-gray-700"
                            : "bg-gray-100"
                        }`}
                      >
                        <span className="font-semibold">{stage}</span>
                        {selectedTeam.progressStage === stage && (
                          <Check
                            className="w-5 h-5"
                            style={{ color: "#960000" }}
                          />
                        )}
                      </div>
                    ))}
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
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition hover:scale-105 ${
                        darkMode
                          ? "bg-gray-700 text-white"
                          : "bg-gray-200 text-black"
                      }`}
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
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition hover:scale-105"
                      style={{ backgroundColor: "#960000", color: "white" }}
                    >
                      Advance <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => advanceOrder(selectedTeam, "sizing")}
                      className="flex-1 py-3 rounded-lg font-semibold transition hover:scale-105"
                      style={{ backgroundColor: "#960000", color: "white" }}
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
                    className="flex-1 py-3 rounded-lg font-semibold transition hover:scale-105"
                    style={{ backgroundColor: "#960000", color: "white" }}
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
                    className="flex-1 py-3 rounded-lg font-semibold transition hover:scale-105"
                    style={{ backgroundColor: "#960000", color: "white" }}
                  >
                    Next Step
                  </button>
                  <button
                    onClick={() => deleteOrder(selectedTeam.id)}
                    className={`px-6 py-3 rounded-lg font-semibold transition hover:scale-105 ${
                      darkMode
                        ? "bg-gray-700 text-white"
                        : "bg-gray-200 text-black"
                    }`}
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
    </div>
  );
};

export default GeeGraphicsSystem;
