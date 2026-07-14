/* 메뉴/주문 데이터 레이어. Supabase(Postgres)에 저장하고, 관리자 CRUD와 고객 조회가 공통으로 사용합니다. */
(function (global) {
  "use strict";

  var CATEGORIES = ["전체", "커피", "음료", "디저트"];
  var GUEST_ORDER_IDS_KEY = "cafeapp_guest_order_ids";

  function getCategories() {
    return CATEGORIES.slice();
  }

  /* ===== 메뉴 ===== */
  function normalizeMenu(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      price: row.price,
      description: row.description,
      image: row.image,
      imagePosition: row.image_position || "50% 50%",
      imageZoom: row.image_zoom || 1,
      soldOut: row.sold_out,
      createdAt: row.created_at
    };
  }

  function getMenus() {
    return global.sb.from("menus").select("*").order("created_at").then(function (res) {
      if (res.error) throw res.error;
      return res.data.map(normalizeMenu);
    });
  }

  function getMenuById(id) {
    return global.sb.from("menus").select("*").eq("id", id).maybeSingle().then(function (res) {
      if (res.error) throw res.error;
      return normalizeMenu(res.data);
    });
  }

  function addMenu(menu) {
    return global.sb.from("menus").insert({
      name: menu.name,
      category: menu.category,
      price: menu.price,
      description: menu.description,
      image: menu.image,
      image_position: menu.imagePosition || "50% 50%",
      image_zoom: menu.imageZoom || 1,
      sold_out: menu.soldOut || false
    }).select().single().then(function (res) {
      if (res.error) throw res.error;
      return normalizeMenu(res.data);
    });
  }

  function updateMenu(id, updates) {
    var payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.price !== undefined) payload.price = updates.price;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.image !== undefined) payload.image = updates.image;
    if (updates.imagePosition !== undefined) payload.image_position = updates.imagePosition;
    if (updates.imageZoom !== undefined) payload.image_zoom = updates.imageZoom;
    if (updates.soldOut !== undefined) payload.sold_out = updates.soldOut;

    return global.sb.from("menus").update(payload).eq("id", id).select().maybeSingle().then(function (res) {
      if (res.error) throw res.error;
      return normalizeMenu(res.data);
    });
  }

  function deleteMenu(id) {
    return global.sb.from("menus").delete().eq("id", id).then(function (res) {
      if (res.error) throw res.error;
    });
  }

  function loadImageBitmap(file) {
    if (global.createImageBitmap) {
      return global.createImageBitmap(file);
    }
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  function resizeImageFile(file, maxDimension, quality) {
    if (!/^image\//.test(file.type)) return Promise.resolve(file);

    var outputType = file.type === "image/png" ? "image/png" : "image/jpeg";

    return loadImageBitmap(file).then(function (bitmap) {
      var scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
      var width = Math.max(1, Math.round(bitmap.width * scale));
      var height = Math.max(1, Math.round(bitmap.height * scale));

      var canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);

      return new Promise(function (resolve) {
        canvas.toBlob(function (blob) {
          resolve(blob || file);
        }, outputType, quality);
      });
    }).catch(function () {
      return file;
    });
  }

  function uploadMenuImage(file) {
    /* 원본 이미지를 그대로 올리면 업로드 시간이 파일 크기에 비례해 길어지므로,
       업로드 전 브라우저에서 긴 변을 1280px로 리사이즈하고 JPEG로 압축합니다. */
    return resizeImageFile(file, 1280, 0.82).then(function (blob) {
      var ext = blob.type === "image/png" ? "png" : "jpg";
      var path = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7) + "." + ext;

      return global.sb.storage.from("menu-images").upload(path, blob, {
        upsert: true,
        contentType: blob.type || file.type
      }).then(function (res) {
        if (res.error) throw res.error;
        return global.sb.storage.from("menu-images").getPublicUrl(path).data.publicUrl;
      });
    });
  }

  /* ===== 주문 ===== */
  function normalizeOrder(row) {
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      status: row.status,
      paymentMethod: row.payment_method,
      total: row.total,
      items: row.items,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  function rememberGuestOrder(id) {
    var raw = localStorage.getItem(GUEST_ORDER_IDS_KEY);
    var ids = [];
    try {
      ids = raw ? JSON.parse(raw) : [];
    } catch (e) {
      ids = [];
    }
    ids.push(id);
    localStorage.setItem(GUEST_ORDER_IDS_KEY, JSON.stringify(ids));
  }

  function getGuestOrderIds() {
    var raw = localStorage.getItem(GUEST_ORDER_IDS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  function getOrders() {
    return global.sb.auth.getSession().then(function (sessionRes) {
      var session = sessionRes.data.session;
      if (session) {
        return global.sb.from("orders").select("*").order("created_at", { ascending: false }).then(function (res) {
          if (res.error) throw res.error;
          return res.data.map(normalizeOrder);
        });
      }

      var ids = getGuestOrderIds();
      if (ids.length === 0) return [];
      return Promise.all(ids.map(function (id) {
        return global.sb.rpc("get_guest_order", { p_order_id: id }).then(function (res) {
          if (res.error) throw res.error;
          return res.data && res.data[0] ? normalizeOrder(res.data[0]) : null;
        });
      })).then(function (orders) {
        return orders.filter(Boolean).sort(function (a, b) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      });
    });
  }

  function getOrderById(id) {
    return global.sb.auth.getSession().then(function (sessionRes) {
      var session = sessionRes.data.session;
      if (session) {
        return global.sb.from("orders").select("*").eq("id", id).maybeSingle().then(function (res) {
          if (res.error) throw res.error;
          if (res.data) return normalizeOrder(res.data);
          return fetchGuestOrder(id);
        });
      }
      return fetchGuestOrder(id);
    });
  }

  function fetchGuestOrder(id) {
    return global.sb.rpc("get_guest_order", { p_order_id: id }).then(function (res) {
      if (res.error) throw res.error;
      return res.data && res.data[0] ? normalizeOrder(res.data[0]) : null;
    });
  }

  function createOrder(order) {
    return global.sb.auth.getSession().then(function (sessionRes) {
      var session = sessionRes.data.session;

      if (session) {
        var payload = {
          user_id: session.user.id,
          status: "pending",
          payment_method: order.paymentMethod,
          total: order.total,
          items: order.items
        };
        return global.sb.from("orders").insert(payload).select().single().then(function (res) {
          if (res.error) throw res.error;
          return normalizeOrder(res.data);
        });
      }

      /* 게스트 주문은 anon role에 orders SELECT 권한이 없어 insert().select()로 결과를 되받을 수 없으므로
         id를 미리 생성해 넘기고, 응답 대신 넘긴 값으로 직접 결과를 구성합니다. */
      var id = crypto.randomUUID();
      var createdAt = new Date().toISOString();
      var guestPayload = {
        id: id,
        user_id: null,
        status: "pending",
        payment_method: order.paymentMethod,
        total: order.total,
        items: order.items,
        created_at: createdAt,
        updated_at: createdAt
      };
      return global.sb.from("orders").insert(guestPayload).then(function (res) {
        if (res.error) throw res.error;
        rememberGuestOrder(id);
        return normalizeOrder(guestPayload);
      });
    });
  }

  function updateOrderStatus(id, status) {
    return global.sb.from("orders").update({ status: status, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle().then(function (res) {
      if (res.error) throw res.error;
      return normalizeOrder(res.data);
    });
  }

  function cancelOrder(id) {
    return global.sb.auth.getSession().then(function (sessionRes) {
      var session = sessionRes.data.session;
      if (session) return updateOrderStatus(id, "cancelled");
      return global.sb.rpc("cancel_guest_order", { p_order_id: id }).then(function (res) {
        if (res.error) throw res.error;
        return fetchGuestOrder(id);
      });
    });
  }

  global.CafeData = {
    getCategories: getCategories,
    getMenus: getMenus,
    getMenuById: getMenuById,
    addMenu: addMenu,
    updateMenu: updateMenu,
    deleteMenu: deleteMenu,
    uploadMenuImage: uploadMenuImage,
    getOrders: getOrders,
    getOrderById: getOrderById,
    createOrder: createOrder,
    updateOrderStatus: updateOrderStatus,
    cancelOrder: cancelOrder
  };
})(window);
