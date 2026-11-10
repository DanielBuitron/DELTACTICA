const PRODUCTS = (window.DT_CATALOG || []).map((item) => ({ ...item }));
const NOTES = Object.fromEntries(PRODUCTS.map((item) => [item.id, item.stage === "ropa" ? "Prenda sobre maniquí, con giro." : "Pieza con giro para consultar."]));
const LINES = [...new Set(PRODUCTS.map((item) => item.line))];

const KEYS = { cart: "dt-cart", orders: "dt-orders", stock: "dt-stock", admin: "dt-admin", examples: "dt-examples-v1", wa: "dt-wa", wompi: "dt-wompi", internal: "dt-internal", trace: "dt-trace", lang: "dt-lang", ficha: "dt-ficha", trm: "dt-trm" };
const I18N = {
  "Saltar al contenido": "Skip to content",
  "Volver al sitio": "Back to the site",
  "Sitio": "Site",
  "Iniciar sesión": "Sign in",
  "Acceso": "Access",
  "Ingreso administrativo del panel.": "Administrative sign-in.",
  "Usuario": "User",
  "Contraseña": "Password",
  "Entrar": "Enter",
  "El usuario o la contraseña no coinciden.": "The user or password does not match.",
  "Panel de control": "Control panel",
  "Operación": "Operation",
  "Los ejemplos y los pedidos de este navegador se leen juntos.": "Examples and orders from this browser are read together.",
  "Salir": "Sign out",
  "Sesión abierta": "Signed in",
  "Abrir panel": "Open panel",
  "General": "Overview",
  "Ventas": "Sales",
  "Bodega": "Warehouse",
  "Trazabilidad": "Trace",
  "Descargar catálogo": "Download catalog",
  "Configuración": "Settings",
  "Referencias": "References",
  "Unidades": "Units",
  "Pedidos": "Orders",
  "Por despachar": "To ship",
  "Por reponer": "To restock",
  "Ventas por mes": "Sales by month",
  "Seis meses, con los ejemplos y los pedidos de este navegador.": "Six months, with the examples and the orders from this browser.",
  "Ventas de los últimos seis meses": "Sales for the last six months",
  "Ventas por línea": "Sales by line",
  "Ver todas": "Show all",
  "Ver menos": "Show less",
  "Otras líneas": "Other lines",
  "Estado de pedidos": "Order status",
  "Ninguna referencia está en el mínimo.": "No reference is at the minimum.",
  "Reponer": "Restock",
  "y": "and",
  "más": "more",
  "Recibido": "Received",
  "En preparación": "In preparation",
  "Despachado": "Shipped",
  "Entregado": "Delivered",
  "Por cobrar y despachar": "To collect and ship",
  "siguen abiertos.": "are still open.",
  "Una compra confirmada entra en esta tabla. El precio queda a consultar hasta que el asesor lo cierre.": "A confirmed purchase lands in this table. The price stays on request until the advisor closes it.",
  "Pedido": "Order",
  "Fecha": "Date",
  "Cliente": "Customer",
  "Ciudad": "City",
  "Total": "Total",
  "Estado": "Status",
  "Ejemplo": "Example",
  "Todavía no hay pedidos.": "There are no orders yet.",
  "Anterior": "Previous",
  "Siguiente": "Next",
  "Imágenes del catálogo": "Catalog images",
  "Suba la carpeta, un zip o la foto de una referencia. Al entrar, la imagen se recorta al tamaño de ficha, se aclara si viene oscura y queda lista para el celular.": "Upload a folder, a zip, or one reference photo. On the way in, the image is sized for the product sheet, lifted if it is dark, and ready for a phone.",
  "Suelte aquí la carpeta o las imágenes.": "Drop the folder or the images here.",
  "Subir carpeta": "Upload folder",
  "Elegir imágenes o zip": "Choose images or zip",
  "Quitar cargadas": "Remove uploads",
  "Buscar": "Search",
  "Línea": "Line",
  "Todas": "All",
  "Referencia o nombre": "Reference or name",
  "Artículo": "Item",
  "Existencia": "Stock",
  "Disponible": "Available",
  "Sin coincidencias.": "No matches.",
  "Ficha": "Sheet",
  "Volver a la lista": "Back to the list",
  "Precio": "Price",
  "Precio COP": "Price COP",
  "Precio USD": "Price USD",
  "TRM Banco de la República": "Central Bank rate",
  "Última TRM publicada": "Last published rate",
  "Sin TRM por ahora. El dólar se calcula cuando llegue la tasa del Banco de la República.": "No rate yet. The dollar is calculated when the Central Bank rate arrives.",
  "A consultar": "On request",
  "Ubicación": "Location",
  "Nota": "Note",
  "Mínimo": "Minimum",
  "Guardar ficha": "Save sheet",
  "Cambiar imagen": "Change image",
  "La foto se ajusta sola: tamaño, resolución e iluminación.": "The photo adjusts itself: size, resolution, and light.",
  "Ficha guardada.": "Sheet saved.",
  "Entradas": "Entries",
  "Salidas": "Exits",
  "Visitantes": "Visitors",
  "Páginas vistas": "Page views",
  "Búsquedas": "Searches",
  "Permanencia": "Time on site",
  "Más buscado": "Most searched",
  "Más vendido": "Best seller",
  "Menos vendido": "Least sold",
  "Sin datos todavía": "No data yet",
  "Todavía no hay compras confirmadas.": "There are no confirmed purchases yet.",
  "Del ingreso al pedido": "From visit to order",
  "Pantallas": "Screens",
  "Todavía no hay páginas vistas.": "There are no page views yet.",
  "Últimas visitas": "Latest visits",
  "La primera visita queda registrada al abrir el sitio.": "The first visit is recorded when the site opens.",
  "Lo más movido": "Most active",
  "Vistas": "Views",
  "Carrito": "Cart",
  "Vendidas": "Sold",
  "Entraron": "Entered",
  "Catálogo": "Catalog",
  "Compra": "Checkout",
  "Inicio": "Home",
  "Prueba tu uniforme": "Try your uniform",
  "Contacto": "Contact",
  "Salió": "Left",
  "En el sitio": "On the site",
  "Entrada": "Entry",
  "uds.": "units",
  "También sin vender:": "Also unsold:",
  "referencias.": "references.",
  "Asesor comercial": "Sales advisor",
  "Este WhatsApp recibe los pedidos y atiende el botón del sitio.": "This WhatsApp receives the orders and answers the site button.",
  "Número": "Number",
  "Guardar número": "Save number",
  "Pasarela Wompi": "Wompi checkout",
  "Cuando el comercio tenga las llaves, péguelas aquí. El pago en línea del pedido usa esa pasarela.": "When the store has the keys, paste them here. The order checkout uses that gateway.",
  "Llave pública": "Public key",
  "Secreto de integridad": "Integrity secret",
  "Guardar Wompi": "Save Wompi",
  "Wompi está listo para cobrar en el pedido.": "Wompi is ready to charge on the order.",
  "Wompi queda abierto hasta tener las llaves.": "Wompi stays open until the keys are in.",
  "Wompi está listo para cobrar en el pedido.": "Wompi is ready to charge on the order.",
  "Escriba el celular del asesor. Ejemplo: 3227043082.": "Type the advisor phone. Example: 3227043082.",
  "El asesor atiende en": "The advisor answers at",
  "Escriba una dirección http o https. Ejemplo: https://api.deltactica.com": "Type an http or https address. Example: https://api.deltactica.com",
  "No se pudo leer la carpeta en este navegador.": "This browser could not read the folder.",
  "Aplicación interna": "Internal application",
  "A partir de diciembre o enero este sitio le enviará pedidos, existencia, el WhatsApp del asesor, el aviso de pago y la trazabilidad. Pegue la dirección cuando el software exista. Vacía, la compra sigue en este navegador.": "From December or January this site will send orders, stock, the advisor WhatsApp, the payment notice, and the trace. Paste the address when the software exists. Empty, the purchase stays in this browser.",
  "Dirección": "Address",
  "Guardar dirección": "Save address",
  "La comunicación apunta a": "The link points to",
  "Combine líneas o busque una referencia. Descargue el catálogo completo o solo lo que dejó filtrado.": "Combine lines or search a reference. Download the full catalog or only what you filtered.",
  "Líneas del PDF": "PDF lines",
  "Descargar filtrado": "Download filtered",
  "Descargar completo": "Download full catalog",
  "Catálogo completo": "Full catalog",
  "Elija al menos una línea.": "Choose at least one line.",
  "Se descargó": "Downloaded",
  "No se pudo armar el PDF.": "The PDF could not be built.",
  "referencia": "reference",
  "referencias": "references",
  "y más en el PDF.": "more in the PDF.",
  "mil": "k",
  "1 imagen quedó en su referencia": "1 image landed on its reference",
  "imágenes quedaron en su referencia": "images landed on their references",
  "archivo no coincidió": "file did not match",
  "archivos no coincidieron": "files did not match",
  "con una referencia del catálogo": "a catalog reference",
  "Ningún archivo coincidió con una referencia.": "No file matched a reference.",
  "Se quitaron las imágenes cargadas. El catálogo volvió a las fotos del sitio.": "Uploaded images were removed. The catalog went back to the site photos.",
  "No se pudo leer esa carpeta. Use el botón Subir carpeta.": "That folder could not be read. Use Upload folder.",
  "Cargada": "Uploaded",
  "Quitar": "Remove",
  "Página": "Page",
  "de": "of",
  "La comunicación queda abierta. Aún no hay dirección.": "The link stays open. There is no address yet.",
  "Abrir menú": "Open menu",
  "Cerrar menú": "Close menu",
  "Secciones": "Sections",
  "Pie de página": "Footer",
  "Fabricante de uniformes y artículos tácticos.": "Maker of uniforms and tactical gear.",
  "Escribir al asesor comercial por WhatsApp": "Message the sales advisor on WhatsApp",
  "Hola, quiero hablar con el asesor comercial de Deltactica sobre artículos tácticos y militares.": "Hello, I want to talk with the Deltactica sales advisor about tactical and military gear.",
  "Administración": "Administration",
  "Deltactica | Artículos tácticos y militares": "Deltactica | Tactical and military gear",
  "Fabricante de uniformes": "Uniform maker",
  "El uniforme sale de esta casa.": "The uniform comes from this house.",
  "Deltactica fabrica los uniformes y completa el equipo táctico y militar. Antes de pedir, la pieza se ve. El asesor confirma talla, cantidad y precio.": "Deltactica makes the uniforms and completes the tactical and military kit. The piece is shown before you order. The advisor confirms size, quantity, and price.",
  "Hablar con el asesor": "Talk to the advisor",
  "Ir al catálogo": "Go to the catalog",
  "Lo que importa": "What matters",
  "Tres datos. El catálogo va después.": "Three facts. The catalog comes after.",
  "Fabricación propia": "Made in house",
  "Los uniformes los hace Deltactica. El equipo táctico y militar sigue en la misma línea.": "Deltactica makes the uniforms. The tactical and military kit follows the same line.",
  "La pieza, a la vista": "The piece, in view",
  "Cada pieza se abre en foto, con su referencia.": "Each piece opens in a photo, with its reference.",
  "Un asesor en el pedido": "An advisor on the order",
  "Talla, cantidad y precio los cierra quien atiende, por WhatsApp, con la referencia delante.": "Size, quantity, and price are closed by the person who answers, on WhatsApp, with the reference in front.",
  "Cómo seguir": "How to continue",
  "Probar": "Try on",
  "Vestir el maniquí con el uniforme.": "Dress the mannequin with the uniform.",
  "Escribir": "Write",
  "Dejar institución, ciudad y referencia.": "Leave the institution, city, and reference.",
  "Catálogo | Deltactica": "Catalog | Deltactica",
  "Pantalla de catálogo": "Catalog screen",
  "Catálogo Deltactica": "Deltactica catalog",
  "Las referencias del catálogo, separadas por categoría. Abra una pieza para girarla en 360 y añadirla al carrito. El precio lo confirma el asesor.": "The catalog references, split by category. Open a piece to turn it and add it to the cart. The advisor confirms the price.",
  "Todas las líneas": "All lines",
  "Elegir línea": "Choose a line",
  "Ver líneas anteriores": "See previous lines",
  "Filtrar catálogo": "Filter catalog",
  "Ver más líneas": "See more lines",
  "Ver foto": "See photo",
  "Ver en 360": "See in 360",
  "Añadir al carrito": "Add to cart",
  "Consultar referencia": "Ask about this reference",
  "Foto por reemplazar": "Photo to replace",
  "1 referencia": "1 reference",
  "Varias líneas": "Several lines",
  "Buscar en el catálogo": "Search the catalog",
  "Buscar por palabra": "Search by word",
  "Contacto | Deltactica": "Contact | Deltactica",
  "Pantalla de contacto": "Contact screen",
  "Asesor comercial.": "Sales advisor.",
  "Deje la institución, la ciudad y la referencia. El mensaje sale armado hacia WhatsApp.": "Leave the institution, the city, and the reference. The message is sent ready to WhatsApp.",
  "Canal": "Channel",
  "WhatsApp con el asesor comercial.": "WhatsApp with the sales advisor.",
  "Cotización": "Quote",
  "Según referencia, cantidad y marcación.": "According to reference, quantity, and marking.",
  "Tallas": "Sizes",
  "El asesor ayuda a cerrar la distribución.": "The advisor helps close the size split.",
  "Nombre": "Name",
  "Nombre y apellido": "First and last name",
  "Institución": "Institution",
  "Unidad o empresa": "Unit or company",
  "Interés": "Interest",
  "Seleccione una línea": "Select a line",
  "Conjunto de campaña": "Field uniform",
  "Faena": "Work uniform",
  "Abrigo y calzado": "Outerwear and footwear",
  "Equipo": "Kit",
  "Dotación completa": "Full issue",
  "Otra consulta": "Another question",
  "Detalle": "Detail",
  "Cantidad, tallas o referencia": "Quantity, sizes, or reference",
  "Enviar por WhatsApp": "Send on WhatsApp",
  "Abrir WhatsApp con el mensaje para el asesor": "Open WhatsApp with the message for the advisor",
  "Se abrió WhatsApp con su mensaje para el asesor comercial.": "WhatsApp opened with your message for the sales advisor.",
  "Carrito | Deltactica": "Cart | Deltactica",
  "Compra": "Checkout",
  "Datos del cliente": "Customer details",
  "Recibo": "Receipt",
  "El carrito está vacío.": "The cart is empty.",
  "Vaciar carrito": "Empty cart",
  "Restar una unidad": "Remove one",
  "Sumar una unidad": "Add one",
  "Compra | Deltactica": "Checkout | Deltactica",
  "Quién pide": "Who is ordering",
  "Teléfono de contacto": "Contact phone",
  "Datos de envío": "Shipping details",
  "Hacen falta para despachar. Sin estos datos el pedido no sigue.": "These are required to ship. Without them the order does not continue.",
  "Quién recibe": "Who receives it",
  "Teléfono de entrega": "Delivery phone",
  "Departamento": "Department",
  "Seleccione el departamento": "Select the department",
  "Calle, carrera, número": "Street and number",
  "Barrio": "Neighborhood",
  "Indicaciones para la entrega": "Delivery notes",
  "Portería, horario o punto de referencia": "Gate, hours, or a landmark",
  "Pago": "Payment",
  "Forma de pago": "Payment method",
  "Transferencia": "Transfer",
  "Pago contraentrega": "Pay on delivery",
  "Pago en línea Wompi": "Online payment with Wompi",
  "Confirmar y generar recibo": "Confirm and build the receipt",
  "Resumen": "Summary",
  "Cantidad": "Quantity",
  "Producto": "Product",
  "Producto | Deltactica": "Product | Deltactica",
  "Probador": "Fitting room",
  "Prueba tu uniforme | Deltactica": "Try your uniform | Deltactica",
  "Viste el maniquí con las prendas del catálogo. Cada pieza queda en su parte del cuerpo y se puede combinar con las demás.": "Dress the mannequin with catalog clothes. Each piece sits on its part of the body and can be combined with the others.",
  "Mira tu compra": "See your purchase",
  "Maniquí": "Mannequin",
  "Hombre": "Man",
  "Mujer": "Woman",
  "Vista": "View",
  "Frente": "Front",
  "Lado": "Side",
  "Espalda": "Back",
  "Maniquí en blanco": "Empty mannequin",
  "Arrastre para girar. La rueda acerca. Cada prenda ocupa su lugar.": "Drag to turn. The wheel zooms. Each garment takes its place.",
  "Uniforme elegido": "Chosen uniform",
  "Limpiar": "Clear",
  "Guardar": "Save",
  "Exportar GLB": "Export GLB",
  "Solicitar uniforme": "Request the uniform",
  "Cambiar": "Change",
  "Poner": "Put on",
  "Camisas": "Shirts",
  "Chaquetas": "Jackets",
  "Chalecos": "Vests",
  "Pantalones": "Trousers",
  "Uniformes": "Uniforms",
  "Gorras": "Caps",
  "Botas": "Boots",
  "Reatas": "Belts",
  "Accesorios": "Accessories",
  "Modelo 3D": "3D model",
  "Pendiente": "Pending",
  "En este maniquí no hay prendas de esta categoría.": "This mannequin has no garments in this category.",
  "Maniquí femenino. Aquí salen las prendas de mujer y las que sirven para los dos.": "Female mannequin. Women's clothes and unisex pieces are shown here.",
  "Maniquí masculino. Aquí salen las prendas de hombre y las que sirven para los dos.": "Male mannequin. Men's clothes and unisex pieces are shown here.",
  "Esa prenda de abajo no lleva reata en las trabillas.": "Those trousers do not take a belt in the loops.",
  "La reata queda en la cintura, sobre el pantalón.": "The belt sits at the waist, over the trousers.",
  "La reata espera un pantalón para sujetarse en la cintura.": "The belt waits for trousers so it can sit at the waist.",
  "El uniforme cubre torso y piernas. Encima puede ir chaqueta, chaleco, gorra o botas.": "The uniform covers torso and legs. A jacket, vest, cap, or boots can go on top.",
  "La camisa queda en el torso. Con pantalón, la camisa entra; el buzo queda por fuera.": "The shirt sits on the torso. With trousers, the shirt tucks in; a fleece stays outside.",
  "La prenda de abajo sale de la cintura y sigue las piernas.": "The lower garment starts at the waist and follows the legs.",
  "La chaqueta va sobre la camisa, con las mangas en los brazos.": "The jacket goes over the shirt, with the sleeves on the arms.",
  "El chaleco va sobre el torso, sin cubrir los brazos.": "The vest goes over the torso and does not cover the arms.",
  "El calzado queda en los dos pies, apoyado en el suelo.": "The footwear sits on both feet, on the ground.",
  "La gorra queda en la cabeza, con la visera al frente.": "The cap sits on the head, with the brim to the front.",
  "Las gafas quedan en los ojos.": "The glasses sit on the eyes.",
  "Los guantes cubren las dos manos.": "The gloves cover both hands.",
  "La prenda quedó en su lugar.": "The garment is in its place.",
  "Guardado": "Saved",
  "Añadido al carrito": "Added to the cart",
  "Pantalla de dotación": "Issue screen",
  "Cómo se pide.": "How to order.",
  "Cuatro pasos con el asesor. No hay que recorrer el catálogo otra vez: se parte de la referencia.": "Four steps with the advisor. There is no need to walk the catalog again: start from the reference.",
  "Consulta": "Inquiry",
  "Escriba al asesor. Diga qué referencia, cuántas piezas y para qué plazo.": "Write to the advisor. Say which reference, how many pieces, and for when.",
  "Definición": "Definition",
  "Se cierran línea, tallas y marcación. El bordado, si lo hay, lo define quien encarga.": "Line, sizes, and marking are closed. Embroidery, if any, is defined by the buyer.",
  "Confección": "Making",
  "La pieza sale con el corte y la terminación de esa referencia.": "The piece comes out with the cut and finish of that reference.",
  "Entrega": "Delivery",
  "La dotación queda separada por talla, lista para repartir.": "The issue is split by size, ready to hand out.",
  "Pantalla institucional": "Company screen",
  "Hecho en casa.": "Made in house.",
  "Deltactica confecciona artículos tácticos y militares con criterio propio: corte para moverse, refuerzo en el roce y una referencia que no cambia cuando la unidad repone tallas.": "Deltactica makes tactical and military gear its own way: a cut made for movement, reinforcement where it rubs, and a reference that stays the same when a unit reorders sizes.",
  "Cada pieza lleva referencia DT y sale con la terminación de la casa.": "Each piece carries a DT reference and leaves with the house finish.",
  "Uso": "Use",
  "Prendas, calzado, morrales y accesorios. Cada pieza lleva su referencia DT.": "Garments, footwear, packs, and accessories. Each piece carries its DT reference.",
  "Reposición": "Reorder",
  "La misma referencia se retoma cuando hace falta otra talla o otra unidad.": "The same reference is used again when another size or another unit is needed.",
  "Pantalla de líneas": "Lines screen",
  "Las líneas del catálogo.": "The catalog lines.",
  "Cada carpeta del catálogo es una línea. Abra la familia para ver sus referencias.": "Each catalog folder is a line. Open the family to see its references.",
  "Abrir línea": "Open line",
  "Catálogo de lectura": "Reading catalog",
  "Imprimir o guardar PDF": "Print or save PDF",
  "Artículos tácticos y militares": "Tactical and military gear",
  "El catálogo de lectura sale desde el panel, en Descargar catálogo, con las referencias reales.": "The reading catalog comes from the panel, in Download catalog, with the real references.",
  "Abrir el catálogo": "Open the catalog",
  "Cómo se cotiza": "How a quote is made",
  "Indique la referencia DT, la cantidad, las tallas y si lleva marcación. El asesor comercial responde por WhatsApp.": "Give the DT reference, the quantity, the sizes, and whether it is marked. The sales advisor answers on WhatsApp.",
  "Esa referencia no está en el catálogo": "That reference is not in the catalog",
  "Vuelva al catálogo y elija otra pieza.": "Go back to the catalog and choose another piece.",
  "La prenda se ve completa, en vitrina clara. Arrastre para dar la vuelta.": "The garment is shown whole, on a clear stand. Drag to turn it.",
  "La pieza se ve completa, en vitrina clara. Arrastre para dar la vuelta.": "The piece is shown whole, on a clear stand. Drag to turn it.",
  "El calzado está en vitrina clara. Arrastre para dar la vuelta.": "The footwear is on a clear stand. Drag to turn it.",
  "La pieza está en vitrina clara. Arrastre para dar la vuelta.": "The piece is on a clear stand. Drag to turn it.",
  "Foto del producto.": "Product photo.",
  "Prenda sobre maniquí, con giro.": "Garment on a mannequin, with a turn.",
  "Administración | Deltactica": "Administration | Deltactica",
  "Dotación | Deltactica": "Issue | Deltactica",
  "Institucional | Deltactica": "Company | Deltactica",
  "Líneas | Deltactica": "Lines | Deltactica",
  "Catálogo de lectura | Deltactica": "Reading catalog | Deltactica"
};
const ZH = {
  "Saltar al contenido": "跳到内容",
  "Volver al sitio": "返回网站",
  "Sitio": "网站",
  "Iniciar sesión": "登录",
  "Acceso": "进入",
  "Ingreso administrativo del panel.": "管理面板登录。",
  "Usuario": "用户",
  "Contraseña": "密码",
  "Entrar": "进入",
  "El usuario o la contraseña no coinciden.": "用户名或密码不正确。",
  "Panel de control": "控制面板",
  "Operación": "运营",
  "Los ejemplos y los pedidos de este navegador se leen juntos.": "这个浏览器里的示例和订单一起读取。",
  "Salir": "退出",
  "Sesión abierta": "已登录",
  "Abrir panel": "打开面板",
  "General": "总览",
  "Ventas": "销售",
  "Bodega": "仓库",
  "Trazabilidad": "追踪",
  "Descargar catálogo": "下载目录",
  "Configuración": "设置",
  "Referencias": "货号",
  "Unidades": "件数",
  "Pedidos": "订单",
  "Por despachar": "待发货",
  "Por reponer": "待补货",
  "Ventas por mes": "按月销售",
  "Seis meses, con los ejemplos y los pedidos de este navegador.": "六个月，含这个浏览器里的示例和订单。",
  "Ventas de los últimos seis meses": "近六个月销售",
  "Ventas por línea": "按品类销售",
  "Ver todas": "查看全部",
  "Ver menos": "收起",
  "Otras líneas": "其他品类",
  "Estado de pedidos": "订单状态",
  "Ninguna referencia está en el mínimo.": "没有货号处于最低库存。",
  "Reponer": "补货",
  "y": "和",
  "más": "更多",
  "Recibido": "已接收",
  "En preparación": "备货中",
  "Despachado": "已发出",
  "Entregado": "已交付",
  "Por cobrar y despachar": "待收款并发货",
  "siguen abiertos.": "仍未完成。",
  "Una compra confirmada entra en esta tabla. El precio queda a consultar hasta que el asesor lo cierre.": "确认的购买会进入这张表。在顾问确定之前，价格仍为待询。",
  "Pedido": "订单",
  "Fecha": "日期",
  "Cliente": "客户",
  "Ciudad": "城市",
  "Total": "合计",
  "Estado": "状态",
  "Ejemplo": "示例",
  "Todavía no hay pedidos.": "还没有订单。",
  "Anterior": "上一页",
  "Siguiente": "下一页",
  "Imágenes del catálogo": "目录图片",
  "Suba la carpeta, un zip o la foto de una referencia. Al entrar, la imagen se recorta al tamaño de ficha, se aclara si viene oscura y queda lista para el celular.": "上传文件夹、压缩包或一张货号照片。图片会按产品页调整大小，偏暗时会提亮，并适合手机查看。",
  "Suelte aquí la carpeta o las imágenes.": "把文件夹或图片拖到这里。",
  "Subir carpeta": "上传文件夹",
  "Elegir imágenes o zip": "选择图片或压缩包",
  "Quitar cargadas": "清除已上传",
  "Buscar": "搜索",
  "Línea": "品类",
  "Todas": "全部",
  "Referencia o nombre": "货号或名称",
  "Artículo": "物品",
  "Existencia": "库存",
  "Disponible": "有货",
  "Sin coincidencias.": "没有匹配。",
  "Ficha": "产品页",
  "Volver a la lista": "返回列表",
  "Precio": "价格",
  "Precio COP": "哥伦比亚比索价格",
  "Precio USD": "美元价格",
  "TRM Banco de la República": "哥伦比亚央行汇率",
  "Última TRM publicada": "最近公布的汇率",
  "Sin TRM por ahora. El dólar se calcula cuando llegue la tasa del Banco de la República.": "暂时没有汇率。美元会在央行汇率到达后计算。",
  "A consultar": "待询",
  "Ubicación": "位置",
  "Nota": "备注",
  "Mínimo": "最低库存",
  "Guardar ficha": "保存资料",
  "Cambiar imagen": "更换图片",
  "La foto se ajusta sola: tamaño, resolución e iluminación.": "照片会自动调整大小、清晰度和亮度。",
  "Ficha guardada.": "资料已保存。",
  "Entradas": "进入",
  "Salidas": "离开",
  "Visitantes": "访客",
  "Páginas vistas": "浏览页数",
  "Búsquedas": "搜索",
  "Permanencia": "停留时间",
  "Más buscado": "搜索最多",
  "Más vendido": "销量最高",
  "Menos vendido": "销量最低",
  "Sin datos todavía": "还没有数据",
  "Todavía no hay compras confirmadas.": "还没有确认的购买。",
  "Del ingreso al pedido": "从进站到下单",
  "Pantallas": "页面",
  "Todavía no hay páginas vistas.": "还没有浏览记录。",
  "Últimas visitas": "最近访问",
  "La primera visita queda registrada al abrir el sitio.": "打开网站时记下第一次访问。",
  "Lo más movido": "最活跃",
  "Vistas": "浏览",
  "Carrito": "购物车",
  "Vendidas": "已售",
  "Entraron": "进入",
  "Catálogo": "目录",
  "Compra": "结账",
  "Inicio": "首页",
  "Prueba tu uniforme": "试穿制服",
  "Contacto": "联系",
  "Salió": "离开",
  "En el sitio": "在站内",
  "Entrada": "进入",
  "uds.": "件",
  "También sin vender:": "也未售出：",
  "referencias.": "个货号。",
  "Asesor comercial": "销售顾问",
  "Este WhatsApp recibe los pedidos y atiende el botón del sitio.": "这个 WhatsApp 接收订单并回复网站上的按钮。",
  "Número": "号码",
  "Guardar número": "保存号码",
  "Pasarela Wompi": "Wompi 支付",
  "Cuando el comercio tenga las llaves, péguelas aquí. El pago en línea del pedido usa esa pasarela.": "商店有密钥后贴在这里。订单的在线付款使用这个通道。",
  "Llave pública": "公钥",
  "Secreto de integridad": "完整性密钥",
  "Guardar Wompi": "保存 Wompi",
  "Wompi está listo para cobrar en el pedido.": "Wompi 已可在订单中收款。",
  "Wompi queda abierto hasta tener las llaves.": "在有密钥之前，Wompi 保持待用。",
  "Escriba el celular del asesor. Ejemplo: 3227043082.": "填写顾问手机。例如：3227043082。",
  "El asesor atiende en": "顾问的号码是",
  "Escriba una dirección http o https. Ejemplo: https://api.deltactica.com": "填写 http 或 https 地址。例如：https://api.deltactica.com",
  "No se pudo leer la carpeta en este navegador.": "这个浏览器无法读取该文件夹。",
  "Aplicación interna": "内部应用",
  "A partir de diciembre o enero este sitio le enviará pedidos, existencia, el WhatsApp del asesor, el aviso de pago y la trazabilidad. Pegue la dirección cuando el software exista. Vacía, la compra sigue en este navegador.": "从十二月或一月起，本站会发送订单、库存、顾问 WhatsApp、付款通知和追踪。软件就绪后贴上地址。留空时，购买仍留在这个浏览器里。",
  "Dirección": "地址",
  "Guardar dirección": "保存地址",
  "La comunicación apunta a": "通信指向",
  "La comunicación queda abierta. Aún no hay dirección.": "通信仍开着。还没有地址。",
  "Combine líneas o busque una referencia. Descargue el catálogo completo o solo lo que dejó filtrado.": "组合品类或搜索货号。下载完整目录，或只下载筛选后的部分。",
  "Líneas del PDF": "PDF 品类",
  "Descargar filtrado": "下载筛选结果",
  "Descargar completo": "下载完整目录",
  "Catálogo completo": "完整目录",
  "Elija al menos una línea.": "至少选择一个品类。",
  "Se está armando el PDF.": "正在生成 PDF。",
  "Se descargó": "已下载",
  "No se pudo armar el PDF.": "无法生成 PDF。",
  "referencia": "个货号",
  "referencias": "个货号",
  "y más en el PDF.": "以及更多，见 PDF。",
  "mil": "千",
  "Página": "第",
  "de": "共",
  "Abrir menú": "打开菜单",
  "Cerrar menú": "关闭菜单",
  "Secciones": "栏目",
  "Pie de página": "页脚",
  "Fabricante de uniformes y artículos tácticos.": "制服与战术用品制造商。",
  "Escribir al asesor comercial por WhatsApp": "通过 WhatsApp 联系销售顾问",
  "Hola, quiero hablar con el asesor comercial de Deltactica sobre artículos tácticos y militares.": "你好，我想和 Deltactica 的销售顾问谈谈战术和军用物品。",
  "Administración": "管理",
  "Administración | Deltactica": "管理 | Deltactica",
  "Deltactica | Artículos tácticos y militares": "Deltactica | 战术与军用物品",
  "Fabricante de uniformes": "制服制造商",
  "El uniforme sale de esta casa.": "制服从这里做出。",
  "Deltactica fabrica los uniformes y completa el equipo táctico y militar. Antes de pedir, la pieza se ve. El asesor confirma talla, cantidad y precio.": "Deltactica 制作制服并配齐战术与军用装备。下单前可以先看实物。顾问确认尺码、数量和价格。",
  "Hablar con el asesor": "联系顾问",
  "Ir al catálogo": "查看目录",
  "Lo que importa": "重要的事",
  "Tres datos. El catálogo va después.": "三件事。目录在后面。",
  "Fabricación propia": "自己生产",
  "Los uniformes los hace Deltactica. El equipo táctico y militar sigue en la misma línea.": "制服由 Deltactica 制作。战术与军用装备沿同一条线。",
  "La pieza, a la vista": "物品看得见",
  "Cada pieza se abre en foto, con su referencia.": "每件物品都有照片和货号。",
  "Un asesor en el pedido": "订单有顾问",
  "Talla, cantidad y precio los cierra quien atiende, por WhatsApp, con la referencia delante.": "尺码、数量和价格由接待的人在 WhatsApp 上确认，货号就在眼前。",
  "Cómo seguir": "接下来",
  "Probar": "试穿",
  "Vestir el maniquí con el uniforme.": "给模特穿上制服。",
  "Escribir": "留言",
  "Dejar institución, ciudad y referencia.": "留下单位、城市和货号。",
  "Catálogo | Deltactica": "目录 | Deltactica",
  "Pantalla de catálogo": "目录页",
  "Catálogo Deltactica": "Deltactica 目录",
  "Las referencias del catálogo, separadas por categoría. Abra una pieza para girarla en 360 y añadirla al carrito. El precio lo confirma el asesor.": "目录货号按类别分开。打开一件可以旋转并加入购物车。价格由顾问确认。",
  "Todas las líneas": "全部品类",
  "Elegir línea": "选择品类",
  "Ver líneas anteriores": "查看前面的品类",
  "Filtrar catálogo": "筛选目录",
  "Ver más líneas": "查看更多品类",
  "Ver foto": "看照片",
  "Ver en 360": "360 度查看",
  "Añadir al carrito": "加入购物车",
  "Consultar referencia": "咨询这个货号",
  "Foto por reemplazar": "照片待更换",
  "1 referencia": "1 个货号",
  "Varias líneas": "多个品类",
  "Buscar en el catálogo": "在目录中搜索",
  "Buscar por palabra": "按词语搜索",
  "Contacto | Deltactica": "联系 | Deltactica",
  "Pantalla de contacto": "联系页",
  "Asesor comercial.": "销售顾问。",
  "Deje la institución, la ciudad y la referencia. El mensaje sale armado hacia WhatsApp.": "留下单位、城市和货号。消息会整理好发到 WhatsApp。",
  "Canal": "渠道",
  "WhatsApp con el asesor comercial.": "通过 WhatsApp 联系销售顾问。",
  "Cotización": "报价",
  "Según referencia, cantidad y marcación.": "按货号、数量和标记。",
  "Tallas": "尺码",
  "El asesor ayuda a cerrar la distribución.": "顾问协助确定尺码分配。",
  "Nombre": "姓名",
  "Nombre y apellido": "姓名",
  "Institución": "单位",
  "Unidad o empresa": "单位或公司",
  "Interés": "需求",
  "Seleccione una línea": "选择一个品类",
  "Conjunto de campaña": "野战套装",
  "Faena": "作业服",
  "Abrigo y calzado": "外套和鞋",
  "Equipo": "装备",
  "Dotación completa": "全套配发",
  "Otra consulta": "其他咨询",
  "Detalle": "详情",
  "Cantidad, tallas o referencia": "数量、尺码或货号",
  "Enviar por WhatsApp": "通过 WhatsApp 发送",
  "Abrir WhatsApp con el mensaje para el asesor": "打开 WhatsApp 并把消息发给顾问",
  "Se abrió WhatsApp con su mensaje para el asesor comercial.": "WhatsApp 已打开，消息发给销售顾问。",
  "Carrito | Deltactica": "购物车 | Deltactica",
  "Datos del cliente": "客户资料",
  "Recibo": "收据",
  "El carrito está vacío.": "购物车是空的。",
  "Vaciar carrito": "清空购物车",
  "Restar una unidad": "减一件",
  "Sumar una unidad": "加一件",
  "Compra | Deltactica": "结账 | Deltactica",
  "Quién pide": "谁在订",
  "Teléfono de contacto": "联系电话",
  "Datos de envío": "收货资料",
  "Hacen falta para despachar. Sin estos datos el pedido no sigue.": "发货需要这些资料。没有它们，订单无法继续。",
  "Quién recibe": "收货人",
  "Teléfono de entrega": "收货电话",
  "Departamento": "省",
  "Seleccione el departamento": "选择省份",
  "Calle, carrera, número": "街道和门牌",
  "Barrio": "街区",
  "Indicaciones para la entrega": "送货说明",
  "Portería, horario o punto de referencia": "门岗、时间或参照地点",
  "Pago": "付款",
  "Forma de pago": "付款方式",
  "Transferencia": "转账",
  "Pago contraentrega": "货到付款",
  "Pago en línea Wompi": "Wompi 在线支付",
  "Confirmar y generar recibo": "确认并生成收据",
  "Resumen": "摘要",
  "Cantidad": "数量",
  "Producto": "产品",
  "Producto | Deltactica": "产品 | Deltactica",
  "Probador": "试衣间",
  "Prueba tu uniforme | Deltactica": "试穿制服 | Deltactica",
  "Viste el maniquí con las prendas del catálogo. Cada pieza queda en su parte del cuerpo y se puede combinar con las demás.": "用目录里的衣服给模特穿上。每件衣服落在身体对应的位置，并且可以互相搭配。",
  "Mira tu compra": "查看你的购买",
  "Maniquí": "模特",
  "Hombre": "男",
  "Mujer": "女",
  "Vista": "视角",
  "Frente": "正面",
  "Lado": "侧面",
  "Espalda": "背面",
  "Maniquí en blanco": "空模特",
  "Arrastre para girar. La rueda acerca. Cada prenda ocupa su lugar.": "拖动可旋转。滚轮可放大。每件衣服都有自己的位置。",
  "Uniforme elegido": "已选制服",
  "Limpiar": "清空",
  "Guardar": "保存",
  "Exportar GLB": "导出 GLB",
  "Solicitar uniforme": "申请这套制服",
  "Cambiar": "更换",
  "Poner": "穿上",
  "Quitar": "取下",
  "Camisas": "衬衫",
  "Chaquetas": "夹克",
  "Chalecos": "背心",
  "Pantalones": "裤子",
  "Uniformes": "制服",
  "Gorras": "帽子",
  "Botas": "靴子",
  "Reatas": "腰带",
  "Accesorios": "配件",
  "Modelo 3D": "三维模型",
  "Pendiente": "待完成",
  "En este maniquí no hay prendas de esta categoría.": "这个模特没有这一类衣服。",
  "Maniquí femenino. Aquí salen las prendas de mujer y las que sirven para los dos.": "女模特。这里显示女装和男女都可穿的衣服。",
  "Maniquí masculino. Aquí salen las prendas de hombre y las que sirven para los dos.": "男模特。这里显示男装和男女都可穿的衣服。",
  "Esa prenda de abajo no lleva reata en las trabillas.": "这条裤子没有腰带袢，不能系腰带。",
  "La reata queda en la cintura, sobre el pantalón.": "腰带系在腰上，压在裤子外面。",
  "La reata espera un pantalón para sujetarse en la cintura.": "腰带要等裤子就位，才能系在腰上。",
  "El uniforme cubre torso y piernas. Encima puede ir chaqueta, chaleco, gorra o botas.": "制服覆盖上身和腿。外面可以加夹克、背心、帽子或靴子。",
  "La camisa queda en el torso. Con pantalón, la camisa entra; el buzo queda por fuera.": "衬衫贴在上身。配裤子时衬衫塞进裤腰；抓绒衣留在外面。",
  "La prenda de abajo sale de la cintura y sigue las piernas.": "下装从腰部开始，顺着腿往下。",
  "La chaqueta va sobre la camisa, con las mangas en los brazos.": "夹克穿在衬衫外面，袖子套在手臂上。",
  "El chaleco va sobre el torso, sin cubrir los brazos.": "背心穿在上身，不盖住手臂。",
  "El calzado queda en los dos pies, apoyado en el suelo.": "鞋穿在两只脚上，落在地面。",
  "La gorra queda en la cabeza, con la visera al frente.": "帽子戴在头上，帽檐朝前。",
  "Las gafas quedan en los ojos.": "眼镜戴在眼前。",
  "Los guantes cubren las dos manos.": "手套盖住两只手。",
  "La prenda quedó en su lugar.": "衣服已经穿在该在的位置。",
  "Guardado": "已保存",
  "Añadido al carrito": "已加入购物车",
  "Pantalla de dotación": "配发页",
  "Cómo se pide.": "如何下单。",
  "Cuatro pasos con el asesor. No hay que recorrer el catálogo otra vez: se parte de la referencia.": "和顾问一起走四步。不必再翻一遍目录：从货号开始。",
  "Consulta": "咨询",
  "Escriba al asesor. Diga qué referencia, cuántas piezas y para qué plazo.": "写信给顾问。说明货号、件数和期限。",
  "Definición": "确定",
  "Se cierran línea, tallas y marcación. El bordado, si lo hay, lo define quien encarga.": "确定品类、尺码和标记。如有刺绣，由订购方决定。",
  "Confección": "制作",
  "La pieza sale con el corte y la terminación de esa referencia.": "成品按该货号的剪裁和做工完成。",
  "Entrega": "交付",
  "La dotación queda separada por talla, lista para repartir.": "配发按尺码分开，可以分发。",
  "Pantalla institucional": "公司页",
  "Hecho en casa.": "自己做的。",
  "Deltactica confecciona artículos tácticos y militares con criterio propio: corte para moverse, refuerzo en el roce y una referencia que no cambia cuando la unidad repone tallas.": "Deltactica 按自己的标准制作战术和军用物品：剪裁便于活动，易磨处有加固，单位补尺码时货号不变。",
  "Cada pieza lleva referencia DT y sale con la terminación de la casa.": "每件物品都有 DT 货号，并按本厂工艺完成。",
  "Uso": "用途",
  "Prendas, calzado, morrales y accesorios. Cada pieza lleva su referencia DT.": "服装、鞋、背包和配件。每件都有自己的 DT 货号。",
  "Reposición": "补订",
  "La misma referencia se retoma cuando hace falta otra talla o otra unidad.": "需要另一个尺码或另一个单位时，仍用同一个货号。",
  "Pantalla de líneas": "品类页",
  "Las líneas del catálogo.": "目录里的品类。",
  "Cada carpeta del catálogo es una línea. Abra la familia para ver sus referencias.": "目录里的每个文件夹是一个品类。打开这一组即可看货号。",
  "Abrir línea": "打开品类",
  "Catálogo de lectura": "阅读版目录",
  "Imprimir o guardar PDF": "打印或保存 PDF",
  "Artículos tácticos y militares": "战术与军用物品",
  "El catálogo de lectura sale desde el panel, en Descargar catálogo, con las referencias reales.": "阅读版目录从面板的“下载目录”生成，使用真实货号。",
  "Abrir el catálogo": "打开目录",
  "Pedido": "订单",
  "Cómo se cotiza": "如何报价",
  "Indique la referencia DT, la cantidad, las tallas y si lleva marcación. El asesor comercial responde por WhatsApp.": "请写明 DT 货号、数量、尺码以及是否需要标记。销售顾问通过 WhatsApp 回复。",
  "Esa referencia no está en el catálogo": "这个货号不在目录里",
  "Vuelva al catálogo y elija otra pieza.": "返回目录，另选一件。",
  "La prenda se ve completa, en vitrina clara. Arrastre para dar la vuelta.": "衣服完整展示在干净的展台上。拖动即可翻转。",
  "La pieza se ve completa, en vitrina clara. Arrastre para dar la vuelta.": "物品完整展示在干净的展台上。拖动即可翻转。",
  "El calzado está en vitrina clara. Arrastre para dar la vuelta.": "鞋展示在干净的展台上。拖动即可翻转。",
  "La pieza está en vitrina clara. Arrastre para dar la vuelta.": "物品在干净的展台上。拖动即可翻转。",
  "Foto del producto.": "产品照片。",
  "Prenda sobre maniquí, con giro.": "衣服穿在模特上，可以旋转。",
  "Dotación | Deltactica": "配发 | Deltactica",
  "Institucional | Deltactica": "公司 | Deltactica",
  "Líneas | Deltactica": "品类 | Deltactica",
  "Catálogo de lectura | Deltactica": "阅读版目录 | Deltactica",
  "Faltan datos de envío. Complete quién recibe, teléfonos, departamento, ciudad, dirección y barrio.": "收货资料不完整。请填写收货人、电话、省份、城市、地址和街区。",
  "La bodega ya no alcanza para este pedido. Revise el carrito.": "仓库库存不够这个订单。请检查购物车。",
  "Se está armando el recibo en PDF.": "正在生成 PDF 收据。",
  "Transferencia y contraentrega las confirma el asesor por WhatsApp.": "转账和货到付款由顾问在 WhatsApp 上确认。"
};
const desk = { bodegaPage: 1, bodegaLine: "todas", bodegaQuery: "", bodegaId: "", ventasPage: 1, linesOpen: false, fichaNote: "" };

function lang() {
  const value = localStorage.getItem(KEYS.lang);
  return value === "en" || value === "zh" ? value : "es";
}

function t(text) {
  if (lang() === "es" || text == null) return text;
  const table = lang() === "zh" ? ZH : I18N;
  return Object.prototype.hasOwnProperty.call(table, text) ? table[text] : text;
}

function knownPhrase(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return "";
  if (Object.prototype.hasOwnProperty.call(I18N, trimmed) || Object.prototype.hasOwnProperty.call(ZH, trimmed)) return trimmed;
  return "";
}

function ensureLangSwitch() {
  const tools = document.querySelector(".header-tools");
  if (!tools) return;
  let box = tools.querySelector(".lang-switch");
  if (!box) {
    box = document.createElement("div");
    box.className = "lang-switch";
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "Idioma");
    box.innerHTML = '<button type="button" data-lang="es">ES</button><button type="button" data-lang="en">EN</button><button type="button" data-lang="zh">中文</button>';
    tools.prepend(box);
  } else if (!box.querySelector('[data-lang="zh"]')) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.lang = "zh";
    button.textContent = "中文";
    box.appendChild(button);
  }
  box.querySelectorAll("button").forEach((button) => {
    button.style.whiteSpace = "nowrap";
    button.style.letterSpacing = "0";
  });
}

function paintZhFont() {
  if (lang() !== "zh") {
    document.documentElement.style.removeProperty("--font-body");
    document.documentElement.style.removeProperty("--font-display");
    return;
  }
  if (!document.getElementById("zh-font")) {
    const link = document.createElement("link");
    link.id = "zh-font";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap";
    document.head.appendChild(link);
  }
  document.documentElement.style.setProperty("--font-body", '"Noto Sans SC", "Outfit", sans-serif');
  document.documentElement.style.setProperty("--font-display", '"Noto Sans SC", "Big Shoulders Display", sans-serif');
}

function paintPhraseNode(node) {
  if (!node || !node.parentElement || node.parentElement.closest("[data-i18n], .lang-switch, script, style")) return;
  if (!node.__key) {
    const key = knownPhrase(node.textContent);
    if (!key) return;
    const at = node.textContent.indexOf(key);
    node.__key = key;
    node.__lead = node.textContent.slice(0, at);
    node.__tail = node.textContent.slice(at + key.length);
  }
  node.textContent = node.__lead + t(node.__key) + node.__tail;
}

function paintLang() {
  ensureLangSwitch();
  paintZhFont();
  const code = lang();
  document.documentElement.lang = code === "zh" ? "zh-Hans" : code;
  if (!document.documentElement.__title) document.documentElement.__title = document.title;
  if (knownPhrase(document.documentElement.__title)) document.title = t(document.documentElement.__title);
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  const attrs = ["placeholder", "aria-label", "alt", "title"];
  document.querySelectorAll("body *").forEach((el) => {
    if (el.closest(".lang-switch")) return;
    attrs.forEach((attr) => {
      const current = el.getAttribute(attr);
      if (!current && !(el.__attrs && el.__attrs[attr])) return;
      if (!el.__attrs) el.__attrs = {};
      if (!el.__attrs[attr]) {
        const key = knownPhrase(current);
        if (!key) return;
        el.__attrs[attr] = key;
      }
      el.setAttribute(attr, t(el.__attrs[attr]));
    });
  });
  document.querySelectorAll("[data-wa-text]").forEach((link) => {
    if (!link.__wa) link.__wa = link.dataset.waText;
    if (!knownPhrase(link.__wa)) return;
    link.dataset.waText = t(link.__wa);
    const phone = document.body.dataset.wa;
    if (phone && link.tagName === "A") {
      link.href = `https://wa.me/${phone}?text=${encodeURIComponent(link.dataset.waText)}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
  });
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(paintPhraseNode);
  document.querySelectorAll("[data-lang]").forEach((button) => {
    const on = button.dataset.lang === code;
    button.classList.toggle("is-on", on);
    button.setAttribute("aria-pressed", on ? "true" : "false");
  });
}
window.t = t;
window.dtPaintLang = paintLang;
const ADMIN = { user: "delta", password: "admin123", name: "Admin" };
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const LINE_PALETTE = ["#f4f5f6", "#c5c8cc", "#8d939a", "#d7c4a3", "#6d737a", "#b7bcc2", "#9aa0a6", "#e4e6e8"];
const LINE_COLORS = Object.fromEntries(LINES.map((line, index) => [line, LINE_PALETTE[index % LINE_PALETTE.length]]));
const root = /\/fichas\//.test(location.pathname) ? "../" : "";

function money(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function readAmount(raw) {
  const text = String(raw || "").trim().replace(/\s/g, "").replace(/[^\d.,]/g, "");
  if (!text) return 0;
  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  let normalized = text;
  if (lastComma >= 0 && lastDot >= 0) {
    normalized = lastComma > lastDot ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
  } else if (lastComma >= 0) {
    const decimals = text.length - lastComma - 1;
    normalized = decimals === 3 ? text.replace(/,/g, "") : text.replace(",", ".");
  } else if (lastDot >= 0) {
    const decimals = text.length - lastDot - 1;
    normalized = decimals === 3 ? text.replace(/\./g, "") : text;
  }
  const number = Number(normalized);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function formatCop(value) {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(value);
}

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function priceText(cop, usd) {
  const parts = [];
  if (cop) parts.push(`COP ${formatCop(cop)}`);
  if (usd) parts.push(`USD ${formatUsd(usd)}`);
  return parts.join(" · ") || "A consultar";
}

const TRM_URL = "https://www.datos.gov.co/resource/32sa-8pi3.json?$select=valor,vigenciadesde,vigenciahasta&$order=vigenciadesde%20DESC&$limit=1";
let trmState = read(KEYS.trm, null);

function bogotaToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

function trmRate() {
  const value = Number(trmState && trmState.valor);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function trmFresh(state) {
  if (!state || !state.hasta) return false;
  return String(state.hasta).slice(0, 10) >= bogotaToday();
}

function trmNote() {
  const rate = trmRate();
  if (!rate) return t("Sin TRM por ahora. El dólar se calcula cuando llegue la tasa del Banco de la República.");
  const day = String((trmState && (trmState.hasta || trmState.desde)) || "").slice(0, 10);
  const date = day ? new Date(`${day}T12:00:00`).toLocaleDateString(lang() === "en" ? "en-US" : "es-CO", { day: "numeric", month: "short", year: "numeric" }) : "";
  const rateText = new Intl.NumberFormat(lang() === "en" ? "en-US" : "es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(rate);
  const label = trmFresh(trmState) ? t("TRM Banco de la República") : t("Última TRM publicada");
  return `${label}: 1 USD = ${rateText} COP${date ? ` · ${date}` : ""}`;
}

function copToUsd(cop) {
  const rate = trmRate();
  if (!cop || !rate) return 0;
  return Math.round((cop / rate) * 100) / 100;
}

function usdToCop(usd) {
  const rate = trmRate();
  if (!usd || !rate) return 0;
  return Math.round(usd * rate);
}

function paintTrm() {
  document.querySelectorAll("[data-trm-note]").forEach((node) => {
    node.textContent = trmNote();
  });
  const copInput = document.querySelector("[data-price-cop]");
  const usdInput = document.querySelector("[data-price-usd]");
  const rate = trmRate();
  if (copInput && usdInput && rate && document.activeElement !== copInput && document.activeElement !== usdInput) {
    const cop = readAmount(copInput.value);
    const usd = readAmount(usdInput.value);
    if (cop) usdInput.value = String(copToUsd(cop));
    else if (usd) copInput.value = String(usdToCop(usd));
  }
  paintPrices();
  const shown = document.querySelector("[data-product-price]");
  if (shown) {
    const item = product(new URLSearchParams(location.search).get("id"));
    if (item) shown.textContent = priceLabel(item);
  }
}

function loadTrm() {
  if (trmFresh(trmState)) {
    paintTrm();
    return Promise.resolve(trmState);
  }
  return fetch(TRM_URL, { headers: { Accept: "application/json" } }).then((response) => {
    if (!response.ok) throw new Error("trm");
    return response.json();
  }).then((rows) => {
    const row = Array.isArray(rows) ? rows[0] : null;
    const valor = Number(row && row.valor);
    if (!valor) throw new Error("trm");
    trmState = { valor, desde: row.vigenciadesde || "", hasta: row.vigenciahasta || "" };
    write(KEYS.trm, trmState);
    paintTrm();
    return trmState;
  }).catch(() => {
    paintTrm();
    return trmState;
  });
}

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function internalBase() {
  return String(localStorage.getItem(KEYS.internal) || "").trim();
}

function saveInternalBase(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    localStorage.removeItem(KEYS.internal);
    return "";
  }
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const base = `${url.origin}${url.pathname}`.replace(/\/$/, "");
  localStorage.setItem(KEYS.internal, base);
  return base;
}

function notifyInternal(tipo, datos) {
  const base = internalBase();
  if (!base) return;
  fetch(`${base}/api/sitio`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ origen: "sitio-deltactica", tipo, fecha: new Date().toISOString(), datos }),
  }).catch(() => {});
}

function traceEvents() {
  const saved = read(KEYS.trace, []);
  return Array.isArray(saved) ? saved : [];
}

function traceKey(storage, key) {
  let id = storage.getItem(key);
  if (!id) {
    id = `${key.slice(3, 4)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    storage.setItem(key, id);
  }
  return id;
}

function currentPage() {
  const path = location.pathname.toLowerCase();
  if (path.includes("admin.html")) return null;
  if (path.endsWith("producto.html")) {
    const id = new URLSearchParams(location.search).get("id") || "";
    const item = product(id);
    return item ? { name: `Ficha ${item.id}`, product: item.id } : { name: "Ficha", product: "" };
  }
  if (path.endsWith("/") || /\/deltactica\/?$/.test(path)) return { name: "Inicio", product: "" };
  const names = [
    ["catalogo-impreso.html", "Catálogo impreso"],
    ["catalogo.html", "Catálogo"],
    ["probar.html", "Prueba tu uniforme"],
    ["virtual.html", "Probador virtual"],
    ["lineas.html", "Líneas"],
    ["institucional.html", "Institucional"],
    ["dotacion.html", "Dotación"],
    ["contacto.html", "Contacto"],
    ["carrito.html", "Carrito"],
    ["compra.html", "Compra"],
    ["index.html", "Inicio"],
  ];
  const found = names.find(([file]) => path.endsWith(file));
  return { name: found ? found[1] : "Otra página", product: "" };
}

function rememberTrace(fields) {
  const page = currentPage();
  if (!page && fields.a !== "pedido") return null;
  const event = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    t: Date.now(),
    s: traceKey(sessionStorage, "dt-session"),
    v: traceKey(localStorage, "dt-visitor"),
    a: fields.a,
    p: fields.p || (page ? page.name : ""),
    d: String(fields.d || "").slice(0, 80),
    n: Number(fields.n) || 0,
  };
  const fresh = traceEvents().filter((item) => Date.now() - item.t < 1000 * 60 * 60 * 24 * 45);
  fresh.push(event);
  write(KEYS.trace, fresh.slice(-600));
  notifyInternal("visita", { accion: event.a, pagina: event.p, detalle: event.d, sesion: event.s });
  return event;
}

function absorbPending(nextName) {
  const id = sessionStorage.getItem("dt-trace-pending");
  if (!id) return;
  sessionStorage.removeItem("dt-trace-pending");
  const events = traceEvents();
  const index = events.findIndex((item) => item.id === id);
  if (index < 0) return;
  events[index] = { ...events[index], a: "paso", d: nextName };
  write(KEYS.trace, events);
}

function beginTrace() {
  const page = currentPage();
  if (!page || window.__dtTrace) return;
  window.__dtTrace = true;
  absorbPending(page.name);
  if (!sessionStorage.getItem("dt-trace-seen")) {
    sessionStorage.setItem("dt-trace-seen", "1");
    rememberTrace({ a: "entrada", p: page.name });
  }
  rememberTrace({ a: "pagina", p: page.name });
  if (page.product) rememberTrace({ a: "ficha", p: page.name, d: page.product });
  const arrived = Date.now();
  let left = false;
  window.addEventListener("pagehide", () => {
    if (left) return;
    left = true;
    const seconds = Math.max(0, Math.round((Date.now() - arrived) / 1000));
    const event = rememberTrace({ a: "salida", p: page.name, n: seconds });
    if (event) sessionStorage.setItem("dt-trace-pending", event.id);
  });
}

const SEARCH_WORDS = {
  bota: "botin calzado zapato",
  gorra: "cachucha kepis boina pava",
  morral: "bolso maleta mochila tula",
  chaqueta: "chaqueta buzo abrigo",
  uniforme: "prenda camisa pantalon",
};

function plainText(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function matchProducts(query) {
  const words = plainText(query).split(/\s+/).filter((word) => word.length > 1);
  if (!words.length) return [];
  return PRODUCTS.filter((item) => {
    const grupo = grupoDe(item.id);
    const familia = grupo ? idsDelGrupo(grupo).map((id) => `${id} ${etiquetaDe(grupo, id)} ${product(id)?.name || ""}`).join(" ") : "";
    const hay = plainText(`${item.id} ${item.name} ${item.line} ${familia} ${grupo ? grupo.nombre : ""} ${NOTES[item.id] || ""} ${Object.entries(SEARCH_WORDS).filter(([key]) => plainText(item.name).includes(plainText(key)) || plainText(item.line).includes(plainText(key))).map(([, words]) => words).join(" ")}`);
    return words.every((word) => hay.includes(word));
  });
}

window.DTSearch = { match: matchProducts };

function mountMenuSearch() {
  const nav = document.querySelector("[data-nav]");
  if (!nav || nav.querySelector("[data-menu-search]")) return;
  const form = document.createElement("form");
  form.className = "menu-search";
  form.dataset.menuSearch = "";
  form.setAttribute("role", "search");
  form.innerHTML = `<input data-menu-query type="search" placeholder="Buscar por palabra" autocomplete="off" aria-label="Buscar en el catálogo" aria-expanded="false" aria-controls="menu-resultados"><div class="menu-results" id="menu-resultados" hidden></div>`;
  nav.prepend(form);
  const input = form.querySelector("[data-menu-query]");
  const list = form.querySelector(".menu-results");
  const paint = () => {
    const query = input.value.trim();
    const found = matchProducts(query);
    if (!query) {
      list.hidden = true;
      list.innerHTML = "";
      input.setAttribute("aria-expanded", "false");
      return;
    }
    const vistos = new Set();
    const rows = found.filter((item) => {
      const clave = principalDe(item.id);
      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    }).slice(0, 6).map((item) => {
      const mostrar = product(principalDe(item.id)) || item;
      const grupo = grupoDe(mostrar.id);
      const titulo = grupo ? grupo.nombre : mostrar.name;
      return `<a href="${root}producto.html?id=${mostrar.id}"><img src="${productImage(mostrar)}" alt="" data-product="${mostrar.id}"><span><b>${mostrar.id} · ${escapeHtml(titulo)}</b><small>${escapeHtml(mostrar.line)} · ${priceLabel(mostrar)}</small></span></a>`;
    }).join("");
    const more = found.length > 6 ? `<a class="menu-more" href="${root}catalogo.html?q=${encodeURIComponent(query)}"><span><b>Ver las ${found.length} referencias</b><small>Abrir el catálogo con esta búsqueda</small></span></a>` : "";
    list.innerHTML = rows || `<p>Ninguna referencia coincide con “${escapeHtml(query)}”.</p>`;
    if (more) list.innerHTML += more;
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
  };
  input.addEventListener("input", paint);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) return;
    if (document.querySelector("[data-count]")) {
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      return;
    }
    location.href = `${root}catalogo.html?q=${encodeURIComponent(query)}`;
  });
  document.addEventListener("click", (event) => {
    if (!form.contains(event.target)) {
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
    }
  });
}

function stayText(seconds) {
  if (!seconds) return "0 s";
  if (seconds < 60) return `${seconds} s`;
  return `${Math.round(seconds / 60)} min`;
}

function product(id) {
  return PRODUCTS.find((item) => item.id === String(id || "").toUpperCase());
}

function fichaDe(id) {
  return read(KEYS.ficha, {})[id] || {};
}

function savedPrice(item) {
  if (!item) return 0;
  const saved = fichaDe(item.id).price;
  if (saved != null && saved !== "") {
    const number = Number(saved);
    if (Number.isFinite(number) && number >= 0) return number;
  }
  return Number(item.price) || 0;
}

function savedUsd(item) {
  if (!item) return 0;
  const cop = savedPrice(item);
  if (cop && trmRate()) return copToUsd(cop);
  const saved = Number(fichaDe(item.id).usd);
  return Number.isFinite(saved) && saved > 0 ? saved : 0;
}

function priceLabel(item) {
  return priceText(savedPrice(item), savedUsd(item));
}

window.dtSavedPrice = savedPrice;
window.dtPriceLabel = priceLabel;

window.DT_VISTAS = window.DT_VISTAS || {
  "DT-1079": 4, "DT-1080": 4, "DT-1188": 4, "DT-1299": 4,
  "DT-1300": 4, "DT-1301": 4, "DT-1302": 4, "DT-1303": 4, "DT-1304": 4, "DT-1305": 4,
  "DT-1306": 4, "DT-1307": 4, "DT-1308": 4, "DT-1309": 4, "DT-1310": 4, "DT-1311": 4,
  "DT-1312": 4, "DT-1313": 4, "DT-1314": 4, "DT-1315": 4, "DT-1316": 4, "DT-1317": 4,
  "DT-1318": 4, "DT-1319": 4, "DT-1320": 4, "DT-1321": 4, "DT-1322": 4, "DT-1323": 4,
  "DT-1324": 4, "DT-1325": 4, "DT-1326": 4, "DT-1327": 4, "DT-1328": 4, "DT-1329": 4,
  "DT-1330": 4, "DT-1331": 4, "DT-1332": 4, "DT-1333": 4, "DT-1334": 4, "DT-1335": 4
};

PRODUCTS.forEach((item) => {
  NOTES[item.id] = window.DT_VISTAS[item.id] ? "Prenda sobre maniquí, con giro." : "Foto del producto.";
});

function productImage(item) {
  if (!item) return "";
  const custom = photoUrls.get(item.id);
  if (custom) return custom;
  if (window.DT_VISTAS && window.DT_VISTAS[item.id]) {
    const clave = String(item.id).toLowerCase().replace(/-/g, "");
    return `${root}img/vueltas/${clave}-01.jpg?v=4`;
  }
  if (item.photo !== false && item.id) return `${root}img/recorte/${String(item.id).toLowerCase()}.webp?v=2`;
  return `${root}${item.image || ""}`;
}

function stockMap() {
  const saved = read(KEYS.stock, {}) || {};
  const next = { ...saved };
  let changed = !read(KEYS.stock, null);
  PRODUCTS.forEach((item) => {
    if (next[item.id] == null) {
      next[item.id] = item.stock;
      changed = true;
    }
  });
  if (changed) write(KEYS.stock, next);
  return next;
}

function monthsBack(n, day) {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - n);
  date.setDate(day);
  date.setHours(9, 30, 0, 0);
  return date.toISOString();
}

function orderLine(id, qty) {
  const item = product(id);
  return { id: item.id, name: item.name, price: savedPrice(item), usd: savedUsd(item), qty };
}

function buildExample(id, date, status, customer, lines) {
  return {
    id,
    date,
    status,
    example: true,
    customer,
    lines,
    total: lines.reduce((sum, line) => sum + line.price * line.qty, 0),
  };
}

function exampleOrders() {
  return [];
}

function orders() {
  const saved = read(KEYS.orders, null);
  if (localStorage.getItem(KEYS.examples) !== "2") {
    const current = Array.isArray(saved) ? saved.filter((order) => !order.example) : [];
    write(KEYS.orders, current);
    localStorage.setItem(KEYS.examples, "2");
    return current;
  }
  if (Array.isArray(saved)) return saved;
  write(KEYS.orders, []);
  return [];
}

function cart() {
  return read(KEYS.cart, []);
}

function saveCart(items) {
  write(KEYS.cart, items);
  paintCount();
}

function available(id) {
  return stockMap()[id] ?? 0;
}

function addToCart(id, qty) {
  const item = product(id);
  const amount = Math.max(1, Number(qty) || 1);
  if (!item) return "Esa referencia no está en la línea.";
  const items = cart();
  const current = items.find((line) => line.id === item.id);
  const next = (current ? current.qty : 0) + amount;
  if (next > available(item.id)) {
    return `En bodega hay ${available(item.id)} de ${item.id}.`;
  }
  if (current) current.qty = next;
  else items.push({ id: item.id, qty: amount });
  saveCart(items);
  return "";
}

function setQty(id, qty) {
  const items = cart().filter((line) => line.id !== id);
  const next = Math.max(0, Number(qty) || 0);
  if (next > 0) {
    if (next > available(id)) return `En bodega hay ${available(id)} de ${id}.`;
    items.push({ id, qty: next });
  }
  saveCart(items);
  return "";
}

function cartCount() {
  return cart().reduce((sum, line) => sum + line.qty, 0);
}

function cartTotal() {
  return cart().reduce((sum, line) => sum + line.qty * (savedPrice(product(line.id)) || 0), 0);
}

function paintCount() {
  const count = cartCount();
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = count ? ` ${count}` : "";
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function placeOrder(customer) {
  const lines = cart().map((line) => {
    const item = product(line.id);
    if (!item) return null;
    return { id: line.id, name: item.name, price: savedPrice(item), usd: savedUsd(item), qty: line.qty };
  }).filter(Boolean);
  if (!lines.length) return null;
  for (const line of lines) {
    if (line.qty > available(line.id)) return null;
  }
  const stock = stockMap();
  lines.forEach((line) => {
    stock[line.id] -= line.qty;
  });
  customer.pago = customer.metodo === "Pago en línea Wompi"
    ? (wompiReady() ? "Pendiente de pago en Wompi" : "Wompi queda abierto. El asesor confirma el cobro hasta tener las llaves.")
    : "Por confirmar con el asesor";
  const order = {
    id: `DT-${String(Date.now()).slice(-6)}`,
    date: new Date().toISOString(),
    customer,
    lines,
    total: lines.reduce((sum, line) => sum + line.price * line.qty, 0),
    status: "Recibido",
  };
  write(KEYS.stock, stock);
  write(KEYS.orders, [order, ...orders()]);
  saveCart([]);
  notifyInternal("pedido", order);
  notifyInternal("existencia", stock);
  lines.forEach((line) => rememberTrace({ a: "pedido", p: "Compra", d: line.id, n: line.qty }));
  return order;
}

function paintPrices() {
  document.querySelectorAll("[data-price]").forEach((node) => {
    const item = product(node.dataset.price);
    if (item) node.textContent = priceLabel(item);
  });
  document.querySelectorAll("[data-stock]").forEach((node) => {
    const item = product(node.dataset.stock);
    if (!item) return;
    const left = available(item.id);
    node.textContent = left ? `Existencia en bodega: ${left}` : "Sin existencia en bodega";
  });
}

function renderCart() {
  const rootNode = document.querySelector("[data-cart-root]");
  if (!rootNode) return;
  const lines = cart();
  if (!lines.length) {
    rootNode.innerHTML = `<p class="lead">El carrito está vacío.</p><a class="btn btn-metal" href="${root}catalogo.html">Ir al catálogo</a>`;
    return;
  }
  const rows = lines.map((line) => {
    const item = product(line.id);
    if (!item) return "";
    return `<tr>
      <td><div class="cart-product"><img src="${productImage(item)}" alt="" data-product="${item.id}"><div><strong>${escapeHtml(item.name)}</strong><span>${item.id} · ${escapeHtml(item.line)}</span></div></div></td>
      <td>${priceLabel(item)}</td>
      <td><div class="qty"><button type="button" data-qty-change="${item.id}" data-dir="-1" aria-label="Restar una unidad">−</button><span>${line.qty}</span><button type="button" data-qty-change="${item.id}" data-dir="1" aria-label="Sumar una unidad">+</button></div></td>
      <td>${priceText(savedPrice(item) * line.qty, savedUsd(item) * line.qty)}</td>
      <td><button class="linkish" type="button" data-remove="${item.id}">Quitar</button></td>
    </tr>`;
  }).join("");
  const totals = cart().reduce((sum, line) => {
    const item = product(line.id);
    return {
      cop: sum.cop + line.qty * (savedPrice(item) || 0),
      usd: sum.usd + line.qty * (savedUsd(item) || 0),
    };
  }, { cop: 0, usd: 0 });
  rootNode.innerHTML = `<table class="cart-table"><thead><tr><th>Artículo</th><th>Precio</th><th>Cantidad</th><th>Total</th><th></th></tr></thead><tbody>${rows}</tbody></table>
    <div class="cart-foot"><button class="linkish" type="button" data-clear-cart>Vaciar carrito</button><div><p class="eyebrow">Total</p><p class="cart-total">${priceText(totals.cop, totals.usd)}</p></div></div>
    <div class="hero-actions"><a class="btn btn-metal" href="${root}compra.html">Continuar con los datos del cliente</a></div>
    <p class="admin-note">El siguiente paso pide quién pide, quién recibe y la dirección. Sin esos datos el pedido no sigue.</p>
    <p class="admin-note" data-cart-msg></p>`;
  applyPhotos();
}

function renderCheckout() {
  const summary = document.querySelector("[data-checkout-summary]");
  const form = document.querySelector("[data-checkout-form]");
  const done = document.querySelector("[data-order-done]");
  if (!summary || !form || !done) return;
  const params = new URLSearchParams(location.search);
  const orderId = params.get("pedido");
  if (orderId) {
    const order = orders().find((item) => item.id === orderId);
    form.hidden = true;
    summary.hidden = true;
    document.querySelector(".checkout-grid")?.setAttribute("hidden", "");
    done.hidden = false;
    document.querySelectorAll(".buy-steps li").forEach((item, index) => {
      item.classList.toggle("is-on", index === 2);
    });
    const heading = document.querySelector(".page-hero h1");
    if (heading) heading.textContent = "Recibo";
    if (!order) {
      done.innerHTML = `<p class="lead">No está ese pedido en este navegador.</p>`;
      return;
    }
    done.innerHTML = receiptView(order);
    mountWompi(order);
    return;
  }
  if (!cart().length) {
    location.href = `${root}carrito.html`;
    return;
  }
  const rows = cart().map((line) => {
    const item = product(line.id);
    if (!item) return "";
    return `<tr><td>${escapeHtml(item.name)}</td><td>${line.qty}</td><td>${priceText(savedPrice(item) * line.qty, savedUsd(item) * line.qty)}</td></tr>`;
  }).join("");
  const totals = cart().reduce((sum, line) => {
    const item = product(line.id);
    return {
      cop: sum.cop + line.qty * (savedPrice(item) || 0),
      usd: sum.usd + line.qty * (savedUsd(item) || 0),
    };
  }, { cop: 0, usd: 0 });
  summary.innerHTML = `<p class="eyebrow">Resumen</p><table class="summary-line"><tbody>${rows}</tbody></table><p class="cart-total">${priceText(totals.cop, totals.usd)}</p>`;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const customer = {
      nombre: String(data.get("nombre") || "").trim(),
      institucion: String(data.get("institucion") || "").trim(),
      telefono: String(data.get("telefono") || "").trim(),
      recibe: String(data.get("recibe") || "").trim(),
      telefonoEnvio: String(data.get("telefonoEnvio") || "").trim(),
      departamento: String(data.get("departamento") || "").trim(),
      ciudad: String(data.get("ciudad") || "").trim(),
      direccion: String(data.get("direccion") || "").trim(),
      barrio: String(data.get("barrio") || "").trim(),
      indicaciones: String(data.get("indicaciones") || "").trim(),
      metodo: String(data.get("metodo") || ""),
      nota: String(data.get("nota") || "").trim(),
    };
    const status = form.querySelector("[data-status]");
    if (!customer.recibe || !customer.telefonoEnvio || !customer.departamento || !customer.ciudad || !customer.direccion || !customer.barrio) {
      status.textContent = "Faltan datos de envío. Complete quién recibe, teléfonos, departamento, ciudad, dirección y barrio.";
      return;
    }
    const order = placeOrder(customer);
    if (!order) {
      status.textContent = "La bodega ya no alcanza para este pedido. Revise el carrito.";
      return;
    }
    status.textContent = "Se está armando el recibo en PDF.";
    window.open(waLink(receiptText(order)), "_blank", "noopener,noreferrer");
    downloadReceipt(order).catch(() => {}).finally(() => {
      location.href = `${root}compra.html?pedido=${order.id}`;
    });
  });
  const paySelect = form.querySelector("[name=metodo]");
  const payNote = form.querySelector("[data-pay-note]");
  const paintPay = () => {
    if (!payNote || !paySelect) return;
    if (paySelect.value !== "Pago en línea Wompi") {
      payNote.textContent = "Transferencia y contraentrega las confirma el asesor por WhatsApp.";
      return;
    }
    payNote.textContent = wompiReady()
      ? "Al confirmar se descarga el PDF y se abre Wompi para pagar este pedido."
      : "Wompi está preparado en este pedido. El cobro en línea se conecta cuando el panel guarde la llave pública y el secreto de integridad.";
  };
  if (paySelect && !paySelect.dataset.bound) {
    paySelect.dataset.bound = "1";
    paySelect.addEventListener("change", paintPay);
  }
  paintPay();
  brandAssets().catch(() => {});
}

function waLink(text) {
  return `https://wa.me/${advisorPhone()}?text=${encodeURIComponent(text)}`;
}

function receiptText(order) {
  const customer = order.customer;
  const lines = order.lines.map((line) => `${line.id} ${line.name} x${line.qty} · ${priceText((line.price || 0) * line.qty, (line.usd || 0) * line.qty)}`).join("\n");
  const usdTotal = order.lines.reduce((sum, line) => sum + (line.usd || 0) * line.qty, 0);
  return [
    `Recibo Deltactica ${order.id}`,
    new Date(order.date).toLocaleString("es-CO"),
    "",
    lines,
    `Total: ${priceText(order.total, usdTotal)}`,
    `Pago: ${customer.metodo || ""}`,
    "",
    "Envío",
    `Recibe: ${customer.recibe || customer.nombre}`,
    `Teléfono de entrega: ${customer.telefonoEnvio || customer.telefono || ""}`,
    customer.direccion || "",
    [customer.barrio, customer.ciudad, customer.departamento].filter(Boolean).join(", "),
    customer.indicaciones ? `Indicaciones: ${customer.indicaciones}` : "",
    "",
    `Pide: ${customer.nombre}${customer.institucion ? ` · ${customer.institucion}` : ""}`,
    `Contacto: ${customer.telefono || ""}`,
    customer.nota ? `Nota: ${customer.nota}` : "",
    customer.pago || "",
    "El recibo en PDF lleva este mismo número.",
  ].filter((line) => line !== "").join("\n");
}

function receiptView(order) {
  const customer = order.customer;
  const usdTotal = order.lines.reduce((sum, line) => sum + (line.usd || 0) * line.qty, 0);
  const rows = order.lines.map((line) => `<tr><td>${escapeHtml(line.id)}</td><td>${escapeHtml(line.name)}</td><td>${line.qty}</td><td>${priceText(line.price, line.usd)}</td><td>${priceText((line.price || 0) * line.qty, (line.usd || 0) * line.qty)}</td></tr>`).join("");
  const link = waLink(receiptText(order));
  return `<article class="receipt">
    <header class="receipt-banner"><img class="receipt-logo" src="${root}img/logo.png" alt="Deltactica"><div><p class="eyebrow">Recibo</p><h2>${escapeHtml(order.id)}</h2><p>${new Date(order.date).toLocaleString("es-CO")}</p></div></header>
    <table class="summary-line"><thead><tr><th>Ref.</th><th>Artículo</th><th>Cant.</th><th>Precio</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="cart-total">${priceText(order.total, usdTotal)}</p>
    <p>Pago: ${escapeHtml(customer.metodo || "")}</p>
    ${customer.pago ? `<p>${escapeHtml(customer.pago)}</p>` : ""}
    <div class="receipt-ship">
      <p class="eyebrow">Envío</p>
      <p>${escapeHtml(customer.recibe || customer.nombre)}</p>
      <p>${escapeHtml(customer.telefonoEnvio || customer.telefono || "")}</p>
      <p>${escapeHtml(customer.direccion || "")}</p>
      <p>${escapeHtml([customer.barrio, customer.ciudad, customer.departamento].filter(Boolean).join(", "))}</p>
      ${customer.indicaciones ? `<p>${escapeHtml(customer.indicaciones)}</p>` : ""}
    </div>
    <p>${escapeHtml(customer.nombre)}${customer.institucion ? ` · ${escapeHtml(customer.institucion)}` : ""} · ${escapeHtml(customer.telefono || "")}</p>
    <div data-wompi-slot></div>
    <div class="receipt-actions">
      <button class="btn btn-metal" type="button" data-download-receipt="${escapeHtml(order.id)}">Descargar PDF</button>
      <a class="btn btn-ghost" href="${link}" target="_blank" rel="noopener noreferrer">Enviar por WhatsApp</a>
      <a class="btn btn-ghost" href="${root}catalogo.html">Volver al catálogo</a>
    </div>
  </article>`;
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("3")) return `57${digits}`;
  if (digits.length === 12 && digits.startsWith("57")) return digits;
  return "";
}

function advisorPhone() {
  return normalizePhone(localStorage.getItem(KEYS.wa)) || normalizePhone(document.body && document.body.dataset.wa) || "573227043082";
}

function prettyPhone(digits) {
  const local = String(digits || "").replace(/^57/, "");
  if (local.length === 10) return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  return digits;
}

function applyAdvisorPhone() {
  const phone = advisorPhone();
  if (document.body) document.body.dataset.wa = phone;
  document.querySelectorAll("[data-wa-text]").forEach((link) => {
    link.href = `https://wa.me/${phone}?text=${encodeURIComponent(link.dataset.waText || "")}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });
  return phone;
}

function wompiConfig() {
  const saved = read(KEYS.wompi, {});
  return {
    publicKey: String(saved.publicKey || "").trim(),
    integrity: String(saved.integrity || "").trim(),
  };
}

function wompiReady() {
  const config = wompiConfig();
  return Boolean(config.publicKey && config.integrity);
}

function ensurePdf() {
  if (window.DTPDF) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${root}js/pdf.js?v=catalogo2`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("pdf"));
    document.head.appendChild(script);
  });
}

function downloadBlob(blob, name) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 2000);
}

async function brandAssets() {
  await ensurePdf();
  const [logo, wordmark] = await Promise.all([
    window.DTPDF.loadJpeg(`${root}img/logo.png`, "#070708").catch(() => null),
    window.DTPDF.loadJpeg(`${root}img/wordmark.png`, "#070708").catch(() => null),
  ]);
  return { logo, wordmark, phone: prettyPhone(advisorPhone()), money };
}

async function downloadReceipt(order) {
  const assets = await brandAssets();
  const blob = await window.DTPDF.receipt(order, assets);
  downloadBlob(blob, `deltactica-recibo-${order.id}.pdf`);
}

async function wompiSignature(reference, amount, currency, secret) {
  const encoded = new TextEncoder().encode(`${reference}${amount}${currency}${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function mountWompi(order) {
  const host = document.querySelector("[data-wompi-slot]");
  if (!host || !order || order.customer.metodo !== "Pago en línea Wompi") return;
  if (!wompiReady()) {
    host.innerHTML = `<p class="admin-note">La pasarela Wompi queda abierta en este pedido. El cobro en línea se activa cuando el panel tenga la llave pública y el secreto de integridad.</p>`;
    return;
  }
  const config = wompiConfig();
  const amount = Math.round(order.total * 100);
  const signature = await wompiSignature(order.id, amount, "COP", config.integrity);
  host.innerHTML = `<p class="eyebrow">Pago en línea</p><p class="admin-note">Wompi cobra ${money(order.total)} con la referencia ${escapeHtml(order.id)}.</p><div data-wompi-button></div>`;
  const script = document.createElement("script");
  script.src = "https://checkout.wompi.co/widget.js";
  script.async = true;
  script.setAttribute("data-render", "button");
  script.setAttribute("data-public-key", config.publicKey);
  script.setAttribute("data-currency", "COP");
  script.setAttribute("data-amount-in-cents", String(amount));
  script.setAttribute("data-reference", order.id);
  script.setAttribute("data-signature:integrity", signature);
  host.querySelector("[data-wompi-button]").appendChild(script);
}

function currentUser() {
  const raw = sessionStorage.getItem(KEYS.admin);
  if (!raw || raw === "1") return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed.user === ADMIN.user ? ADMIN : null;
  } catch {
    return null;
  }
}

function shortMoney(value) {
  if (value >= 1000000) {
    return `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(value / 1000000)} M`;
  }
  if (value >= 1000) {
    return `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(value / 1000)} ${t("mil")}`;
  }
  return money(value);
}

function recentMonths(count = 6) {
  const now = new Date();
  const months = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const names = lang() === "en" ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] : MONTHS;
    months.push({ key: `${date.getFullYear()}-${date.getMonth()}`, label: names[date.getMonth()] });
  }
  return months;
}

function salesByMonth(list) {
  return recentMonths().map((month) => ({
    label: month.label,
    value: list.filter((order) => {
      const date = new Date(order.date);
      return `${date.getFullYear()}-${date.getMonth()}` === month.key;
    }).reduce((sum, order) => sum + order.total, 0),
  }));
}

function salesByLine(list) {
  return LINES.map((line) => ({
    label: line,
    color: LINE_COLORS[line],
    value: list.reduce((sum, order) => sum + order.lines.reduce((lineSum, item) => {
      const found = product(item.id);
      return found && found.line === line ? lineSum + item.price * item.qty : lineSum;
    }, 0), 0),
  }));
}

let chartSeq = 0;

function barChart(series, label) {
  chartSeq += 1;
  const gid = `barMetal${chartSeq}`;
  const width = 560;
  const height = 210;
  const pad = 36;
  const max = Math.max(...series.map((item) => item.value), 1);
  const gap = 12;
  const barWidth = (width - pad * 2 - gap * (series.length - 1)) / series.length;
  const bars = series.map((item, index) => {
    const barHeight = Math.max(2, (item.value / max) * 130);
    const x = pad + index * (barWidth + gap);
    const y = 158 - barHeight;
    return `<g>
      <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barHeight.toFixed(1)}" fill="url(#${gid})" rx="1"></rect>
      <text x="${(x + barWidth / 2).toFixed(1)}" y="${(y - 8).toFixed(1)}" text-anchor="middle" fill="#f3f4f5" font-size="12" font-family="Outfit, sans-serif">${shortMoney(item.value)}</text>
      <text x="${(x + barWidth / 2).toFixed(1)}" y="184" text-anchor="middle" fill="#9aa0a6" font-size="13" font-family="Barlow Condensed, sans-serif" letter-spacing="1">${item.label}</text>
    </g>`;
  }).join("");
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(label)}">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.48" stop-color="#c5c8cc"/><stop offset="1" stop-color="#8d939a"/></linearGradient></defs>
    <line x1="${pad}" y1="158" x2="${width - pad}" y2="158" stroke="rgba(232,233,235,0.18)"></line>
    ${bars}
  </svg>`;
}

function donutChart(parts, label) {
  const active = parts.filter((part) => part.value > 0);
  const total = active.reduce((sum, part) => sum + part.value, 0) || 1;
  const cx = 100;
  const cy = 100;
  const radius = 78;
  const inner = 48;
  let start = -Math.PI / 2;
  const slices = active.map((part) => {
    const angle = (part.value / total) * Math.PI * 2;
    const end = start + Math.min(angle, Math.PI * 2 - 0.0001);
    const large = end - start > Math.PI ? 1 : 0;
    const point = (angle, size) => [cx + Math.cos(angle) * size, cy + Math.sin(angle) * size];
    const [x1, y1] = point(start, radius);
    const [x2, y2] = point(end, radius);
    const [x3, y3] = point(end, inner);
    const [x4, y4] = point(start, inner);
    start = end;
    return `<path d="M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 ${large} 0 ${x4} ${y4} Z" fill="${part.color}"><title>${escapeHtml(part.label)}: ${money(part.value)}</title></path>`;
  }).join("");
  return `<svg class="chart donut" viewBox="0 0 200 200" role="img" aria-label="${escapeHtml(label)}">${slices}<text x="100" y="96" text-anchor="middle" fill="#9aa0a6" font-size="11" font-family="Barlow Condensed, sans-serif" letter-spacing="1">TOTAL</text><text x="100" y="116" text-anchor="middle" fill="#f3f4f5" font-size="16" font-family="Barlow Condensed, sans-serif">${shortMoney(active.reduce((sum, part) => sum + part.value, 0))}</text></svg>`;
}

function legend(parts) {
  return `<ul class="legend">${parts.map((part) => `<li><i style="background:${part.color}"></i><span>${escapeHtml(part.label)}</span><b>${money(part.value)}</b></li>`).join("")}</ul>`;
}

function lineMeters(parts) {
  const max = Math.max(...parts.map((part) => part.value), 1);
  return `<ul class="meters line-meters">${parts.map((part) => `<li><span>${escapeHtml(part.label)}</span><em>${money(part.value)}</em><div class="meter" aria-hidden="true"><i style="width:${part.value ? Math.max(2, Math.round((part.value / max) * 100)) : 0}%"></i></div></li>`).join("")}</ul>`;
}

function meterList(parts) {
  const max = Math.max(...parts.map((part) => part.value), 1);
  return `<ul class="meters">${parts.map((part) => `<li><span>${escapeHtml(part.label)}</span><div class="meter" aria-hidden="true"><i class="${part.warn ? "is-low" : ""}" style="width:${Math.max(2, Math.round((part.value / max) * 100))}%"></i></div><em>${escapeHtml(part.display)}</em></li>`).join("")}</ul>`;
}

function closeAccounts() {
  document.querySelectorAll("[data-account-menu]").forEach((menu) => {
    menu.hidden = true;
  });
  document.querySelectorAll("[data-account-toggle]").forEach((button) => {
    button.setAttribute("aria-expanded", "false");
  });
}

function paintAccount() {
  const session = currentUser();
  document.querySelectorAll("[data-account-link]").forEach((link) => {
    link.hidden = Boolean(session);
  });
  document.querySelectorAll("[data-account-toggle]").forEach((button) => {
    button.hidden = !session;
    if (!session) button.setAttribute("aria-expanded", "false");
  });
  document.querySelectorAll("[data-account-label]").forEach((node) => {
    node.textContent = session ? session.name : t("Iniciar sesión");
  });
  document.querySelectorAll("[data-account-menu]").forEach((menu) => {
    if (!session) {
      menu.hidden = true;
      menu.innerHTML = "";
      return;
    }
    menu.innerHTML = `<p class="account-kicker">${t("Sesión abierta")}</p><p class="account-role">Admin</p><a href="${root}admin.html">${t("Abrir panel")}</a><button type="button" data-logout>${t("Salir")}</button>`;
  });
  const userField = document.querySelector("[data-admin-login] [name=usuario]");
  if (userField && !session) {
    userField.value = ADMIN.user;
    userField.setAttribute("autocomplete", "off");
  }
  const who = document.querySelector("[data-admin-who]");
  if (who && session) {
    who.textContent = t("Los ejemplos y los pedidos de este navegador se leen juntos.");
  }
}

function logout() {
  sessionStorage.removeItem(KEYS.admin);
  closeAccounts();
  paintAccount();
  if (document.querySelector("[data-admin-login]")) renderAdmin();
}

const photoUrls = new Map();

function photoDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("dt-photos", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("photos");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idFromFileName(name) {
  const raw = String(name || "");
  const match = raw.toUpperCase().match(/DT[\s_-]?(\d{3,4})/);
  if (match) {
    const id = `DT-${match[1]}`;
    if (product(id)) return id;
  }
  const stem = plainText(raw.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
  const found = PRODUCTS.find((item) => plainText(item.name) === stem);
  return found ? found.id : "";
}

function rememberPhoto(id, blob) {
  const previous = photoUrls.get(id);
  if (previous) URL.revokeObjectURL(previous);
  if (blob) photoUrls.set(id, URL.createObjectURL(blob));
  else photoUrls.delete(id);
}

async function loadPhotos() {
  const db = await photoDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readonly");
    const request = tx.objectStore("photos").openCursor();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve();
        return;
      }
      rememberPhoto(cursor.key, cursor.value);
      cursor.continue();
    };
  });
}

async function preparePhoto(file) {
  if (!(file.type || "").startsWith("image/") && !/\.(jpe?g|png|webp)$/i.test(file.name || "")) return file;
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const picture = new Image();
      picture.onload = () => resolve(picture);
      picture.onerror = () => reject(new Error("foto"));
      picture.src = url;
    });
    const max = 1400;
    const scale = Math.min(1, max / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0, width, height);
    const frame = ctx.getImageData(0, 0, width, height);
    const data = frame.data;
    let sum = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 64) {
      sum += data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
      count += 1;
    }
    const mean = count ? sum / count : 128;
    if (mean < 58) {
      const gain = Math.min(1.4, 88 / Math.max(mean, 12));
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * gain);
        data[i + 1] = Math.min(255, data[i + 1] * gain);
        data[i + 2] = Math.min(255, data[i + 2] * gain);
      }
      ctx.putImageData(frame, 0, 0);
    }
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
    return blob || file;
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function savePhotoBlob(id, blob) {
  const db = await photoDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readwrite");
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.objectStore("photos").put(blob, id);
  });
  rememberPhoto(id, blob);
}

async function savePhotoFiles(files) {
  const db = await photoDb();
  const matched = [];
  const skipped = [];
  const ready = [];
  for (const file of files) {
    const image = file.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(file.name);
    const id = image ? idFromFileName(file.name) : "";
    if (!id) {
      if (file.name) skipped.push(file.name);
      continue;
    }
    ready.push({ id, blob: await preparePhoto(file) });
  }
  await new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readwrite");
    const store = tx.objectStore("photos");
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    ready.forEach((entry) => {
      store.put(entry.blob, entry.id);
      rememberPhoto(entry.id, entry.blob);
      matched.push(entry.id);
    });
  });
  return { matched: [...new Set(matched)], skipped };
}

async function removePhoto(id) {
  const db = await photoDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readwrite");
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.objectStore("photos").delete(id);
  });
  rememberPhoto(id, null);
}

async function clearPhotos() {
  const db = await photoDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readwrite");
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.objectStore("photos").clear();
  });
  photoUrls.forEach((url) => URL.revokeObjectURL(url));
  photoUrls.clear();
}

function applyPhotos() {
  document.querySelectorAll("img[data-product]").forEach((img) => {
    const url = photoUrls.get(img.dataset.product);
    if (!url) return;
    img.src = url;
  });
}

function paintPhotoDesk() {
  const grid = document.querySelector("[data-photo-grid]");
  if (!grid) return;
  grid.innerHTML = PRODUCTS.map((item) => {
    const custom = photoUrls.has(item.id);
    const src = custom ? photoUrls.get(item.id) : productImage(item);
    return `<figure class="photo-card"><img src="${src}" alt="${escapeHtml(item.name)}" loading="lazy" data-product="${item.id}"><figcaption><strong>${item.id}</strong> ${escapeHtml(item.name)}${custom ? "<em>Cargada</em>" : ""}</figcaption>${custom ? `<button class="linkish" type="button" data-photo-remove="${item.id}">Quitar</button>` : ""}</figure>`;
  }).join("");
}

function photoStatus(matched, skipped) {
  const status = document.querySelector("[data-photo-status]");
  if (!status) return;
  const ready = matched.length === 1 ? t("1 imagen quedó en su referencia") : `${matched.length} ${t("imágenes quedaron en su referencia")}`;
  const names = matched.length ? `: ${matched.join(", ")}.` : ".";
  const ignored = skipped.length
    ? ` ${skipped.length} ${skipped.length === 1 ? t("archivo no coincidió") : t("archivos no coincidieron")} ${t("con una referencia del catálogo")}`
    : "";
  status.textContent = matched.length ? `${ready}${names}${ignored}` : `${t("Ningún archivo coincidió con una referencia.")}${ignored}`;
}

async function filesFromZip(file) {
  if (!/\.zip$/i.test(file.name) || typeof DecompressionStream === "undefined") return [];
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  let end = -1;
  const scan = Math.max(0, bytes.length - 22 - 0xffff);
  for (let index = bytes.length - 22; index >= scan; index -= 1) {
    if (view.getUint32(index, true) === 0x06054b50) {
      end = index;
      break;
    }
  }
  if (end < 0) return [];
  const count = view.getUint16(end + 10, true);
  let cursor = view.getUint32(end + 16, true);
  const files = [];
  for (let index = 0; index < count; index += 1) {
    if (cursor + 46 > bytes.length || view.getUint32(cursor, true) !== 0x02014b50) break;
    const method = view.getUint16(cursor + 10, true);
    const size = view.getUint32(cursor + 20, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    cursor += 46 + nameLength + extraLength + commentLength;
    if (!name || name.endsWith("/")) continue;
    const localName = view.getUint16(localOffset + 26, true);
    const localExtra = view.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + localName + localExtra;
    const compressed = bytes.subarray(start, start + size);
    let raw = compressed;
    if (method === 8) {
      const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      raw = new Uint8Array(await new Response(stream).arrayBuffer());
    } else if (method !== 0) {
      continue;
    }
    const base = name.split("/").pop();
    const type = /\.png$/i.test(base) ? "image/png" : /\.webp$/i.test(base) ? "image/webp" : /\.jpe?g$/i.test(base) ? "image/jpeg" : "";
    files.push(new File([raw], base, { type }));
  }
  return files;
}

async function expandUploads(files) {
  const ready = [];
  for (const file of files) {
    if (/\.zip$/i.test(file.name)) ready.push(...await filesFromZip(file));
    else ready.push(file);
  }
  return ready;
}

async function filesFromList(items) {
  const files = [];
  const walk = async (entry) => {
    if (!entry) return;
    if (entry.isFile) {
      files.push(await new Promise((resolve, reject) => entry.file(resolve, reject)));
      return;
    }
    if (!entry.isDirectory) return;
    const reader = entry.createReader();
    let batch = [];
    do {
      batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
      for (const child of batch) await walk(child);
    } while (batch.length);
  };
  for (const item of items) {
    const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
    if (entry) await walk(entry);
  }
  return files;
}

function topProduct(rows, score) {
  const ranked = rows.filter((row) => score(row) > 0).sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id));
  return ranked[0] || null;
}

function traceBoard() {
  const events = traceEvents();
  const realOrders = orders().filter((order) => !order.example);
  const sessions = [...new Set(events.map((event) => event.s))];
  const visitors = [...new Set(events.map((event) => event.v))];
  const entries = events.filter((event) => event.a === "entrada");
  const exits = events.filter((event) => event.a === "salida");
  const pages = events.filter((event) => event.a === "pagina");
  const searches = events.filter((event) => event.a === "buscar");
  const sessionHas = (names) => sessions.filter((id) => events.some((event) => event.s === id && names.includes(event.p))).length;
  const sessionAction = (action) => sessions.filter((id) => events.some((event) => event.s === id && event.a === action)).length;
  const funnel = [
    { label: t("Entraron"), value: entries.length, display: String(entries.length) },
    { label: t("Catálogo"), value: sessionHas(["Catálogo"]), display: String(sessionHas(["Catálogo"])) },
    { label: t("Ficha"), value: sessionAction("ficha"), display: String(sessionAction("ficha")) },
    { label: t("Carrito"), value: sessionHas(["Carrito"]), display: String(sessionHas(["Carrito"])) },
    { label: t("Compra"), value: sessionHas(["Compra"]), display: String(sessionHas(["Compra"])) },
    { label: t("Pedidos"), value: realOrders.length, display: String(realOrders.length) },
  ];
  const pageCounts = new Map();
  pages.forEach((event) => pageCounts.set(event.p, (pageCounts.get(event.p) || 0) + 1));
  const pageMeters = [...pageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label: t(label), value, display: String(value) }));
  const steps = new Map();
  events.filter((event) => event.a === "paso").forEach((event) => {
    const key = `${event.p} → ${event.d}`;
    steps.set(key, (steps.get(key) || 0) + 1);
  });
  const stepRows = [...steps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const views = {};
  const found = {};
  const carts = {};
  const sold = {};
  PRODUCTS.forEach((item) => {
    views[item.id] = 0;
    found[item.id] = 0;
    carts[item.id] = 0;
    sold[item.id] = 0;
  });
  events.forEach((event) => {
    if (event.a === "ficha" && views[event.d] !== undefined) views[event.d] += 1;
    if (event.a === "carrito" && carts[event.d] !== undefined) carts[event.d] += event.n || 1;
    if (event.a === "buscar") {
      const query = event.d.toLowerCase();
      PRODUCTS.forEach((item) => {
        if (item.id.toLowerCase() === query || item.name.toLowerCase().includes(query)) found[item.id] += 1;
      });
    }
  });
  realOrders.forEach((order) => {
    order.lines.forEach((line) => {
      if (sold[line.id] !== undefined) sold[line.id] += line.qty;
    });
  });
  const rows = PRODUCTS.map((item) => ({
    ...item,
    views: views[item.id],
    found: found[item.id],
    carts: carts[item.id],
    sold: sold[item.id],
  }));
  const wanted = topProduct(rows, (row) => row.found + row.views);
  const best = topProduct(rows, (row) => row.sold);
  const unsold = rows.filter((row) => row.sold === 0);
  const lowest = rows.filter((row) => row.sold > 0).sort((a, b) => a.sold - b.sold || a.id.localeCompare(b.id))[0];
  const productName = (row) => row ? `${row.id} · ${row.name}` : t("Sin datos todavía");
  const leastStrong = !best ? "—" : unsold[0] ? unsold[0].id : (lowest ? lowest.id : "—");
  const leastNote = !best
    ? t("Todavía no hay compras confirmadas.")
    : unsold.length > 1
      ? `${t("También sin vender:")} ${unsold.length - 1} ${t("referencias.")}`
      : productName(unsold[0] || lowest);
  const active = rows
    .filter((row) => row.sold || row.views || row.found || row.carts)
    .sort((a, b) => (b.sold + b.views + b.found) - (a.sold + a.views + a.found))
    .slice(0, 5);
  const activeTable = active.length
    ? `<table class="admin-table"><thead><tr><th>Ref.</th><th>${t("Artículo")}</th><th>${t("Vistas")}</th><th>${t("Vendidas")}</th></tr></thead><tbody>${active.map((row) => `<tr><td>${row.id}</td><td>${escapeHtml(row.name)}</td><td>${row.views}</td><td>${row.sold}</td></tr>`).join("")}</tbody></table>`
    : `<p class="admin-note">${t("Sin datos todavía")}</p>`;
  const groups = new Map();
  events.forEach((event) => {
    if (!groups.has(event.s)) groups.set(event.s, []);
    groups.get(event.s).push(event);
  });
  const recent = [...groups.values()].slice(-6).reverse().map((group) => {
    const path = [];
    group.forEach((event) => {
      if (event.a === "pagina" && path[path.length - 1] !== event.p) path.push(event.p);
    });
    const gone = group.some((event) => event.a === "salida");
    const stamp = new Date(group[0].t).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    return `<li><span>${escapeHtml(stamp)}</span><b>${escapeHtml(path.map((name) => t(name)).join(" → ") || t("Entrada"))}</b><em>${gone ? t("Salió") : t("En el sitio")}</em></li>`;
  }).join("");
  const stayed = events.filter((event) => (event.a === "salida" || event.a === "paso") && event.n > 0);
  const average = stayed.length ? Math.round(stayed.reduce((sum, event) => sum + event.n, 0) / stayed.length) : 0;
  return `<div class="stats">
      <article class="stat"><span>${t("Entradas")}</span><strong>${entries.length}</strong></article>
      <article class="stat"><span>${t("Salidas")}</span><strong>${exits.length}</strong></article>
      <article class="stat"><span>${t("Visitantes")}</span><strong>${visitors.length}</strong></article>
      <article class="stat"><span>${t("Páginas vistas")}</span><strong>${pages.length}</strong></article>
      <article class="stat"><span>${t("Búsquedas")}</span><strong>${searches.length}</strong></article>
      <article class="stat"><span>${t("Permanencia")}</span><strong>${stayText(average)}</strong></article>
    </div>
    <div class="stats">
      <article class="stat"><span>${t("Más buscado")}</span><strong>${wanted ? wanted.id : "—"}</strong><p class="admin-note">${escapeHtml(productName(wanted))}</p></article>
      <article class="stat"><span>${t("Más vendido")}</span><strong>${best ? best.id : "—"}</strong><p class="admin-note">${escapeHtml(productName(best))}${best ? `. ${best.sold} ${t("uds.")}` : ""}</p></article>
      <article class="stat"><span>${t("Menos vendido")}</span><strong>${escapeHtml(leastStrong)}</strong><p class="admin-note">${escapeHtml(leastNote)}</p></article>
    </div>
    <div class="chart-grid">
      <article class="admin-block"><p class="eyebrow">${t("Del ingreso al pedido")}</p>${meterList(funnel)}</article>
      <article class="admin-block"><p class="eyebrow">${t("Pantallas")}</p>${pageMeters.length ? meterList(pageMeters) : `<p class="admin-note">${t("Todavía no hay páginas vistas.")}</p>`}</article>
    </div>
    <div class="chart-grid">
      <article class="admin-block"><p class="eyebrow">${t("Lo más movido")}</p>${activeTable}</article>
      <article class="admin-block"><p class="eyebrow">${t("Últimas visitas")}</p>${recent ? `<ul class="trace-list">${recent}</ul>` : `<p class="admin-note">${t("La primera visita queda registrada al abrir el sitio.")}</p>`}</article>
    </div>`;
}

function renderAdmin() {
  const login = document.querySelector("[data-admin-login]");
  const shell = document.querySelector("[data-admin-shell]");
  if (!login || !shell) return;
  const session = currentUser();
  const open = Boolean(session);
  login.hidden = open;
  shell.hidden = !open;
  paintAccount();
  if (!open) {
    if (!login.dataset.bound) {
      login.dataset.bound = "1";
      login.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = new FormData(login);
        const error = login.querySelector("[data-admin-error]");
        const user = String(data.get("usuario") || "").trim();
        const pass = String(data.get("clave") || "");
        if (user !== ADMIN.user || pass !== ADMIN.password) {
          error.textContent = t("El usuario o la contraseña no coinciden.");
          return;
        }
        error.textContent = "";
        sessionStorage.setItem(KEYS.admin, JSON.stringify({ user: ADMIN.user, name: ADMIN.name }));
        renderAdmin();
      });
    }
    return;
  }

  const list = orders().slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  const stock = stockMap();
  const sold = list.reduce((sum, order) => sum + order.total, 0);
  const pending = list.filter((order) => order.status !== "Entregado").length;
  const low = PRODUCTS.filter((item) => {
    const minimum = fichaDe(item.id).min != null ? Number(fichaDe(item.id).min) : item.min;
    return (stock[item.id] ?? 0) <= minimum;
  });
  const units = PRODUCTS.reduce((sum, item) => sum + (stock[item.id] ?? 0), 0);
  const byMonth = salesByMonth(list);
  const byLine = salesByLine(list);
  const byStatus = ["Recibido", "En preparación", "Despachado", "Entregado"].map((status) => ({
    label: status,
    value: list.filter((order) => order.status === status).length,
    display: String(list.filter((order) => order.status === status).length),
  }));
  const shownLines = (() => {
    const sorted = byLine.slice().sort((a, b) => b.value - a.value);
    if (desk.linesOpen || sorted.length <= 6) return sorted;
    const head = sorted.slice(0, 5);
    const rest = sorted.slice(5).reduce((sum, part) => sum + part.value, 0);
    if (rest) head.push({ label: t("Otras líneas"), color: "#6d737a", value: rest });
    return head;
  })();
  const restock = low.length
    ? `${t("Reponer")} ${low.slice(0, 4).map((item) => item.id).join(", ")}${low.length > 4 ? ` ${t("y")} ${low.length - 4} ${t("más")}` : ""}.`
    : t("Ninguna referencia está en el mínimo.");
  const statusLabel = (status) => t(status);
  const statusOptions = (current) => ["Recibido", "En preparación", "Despachado", "Entregado"].map((status) => `<option value="${status}" style="background:#141416;color:#f3f4f5" ${status === current ? "selected" : ""}>${statusLabel(status)}</option>`).join("");

  const general = document.querySelector('[data-admin-panel="general"]');
  const sales = document.querySelector('[data-admin-panel="ventas"]');
  const warehouse = document.querySelector('[data-admin-panel="bodega"]');
  const wompi = wompiConfig();
  const localPhone = advisorPhone().replace(/^57/, "");
  general.innerHTML = `<div class="stats">
      <article class="stat"><span>${t("Referencias")}</span><strong>${PRODUCTS.length}</strong></article>
      <article class="stat"><span>${t("Unidades")}</span><strong>${units}</strong></article>
      <article class="stat"><span>${t("Pedidos")}</span><strong>${list.length}</strong></article>
      <article class="stat"><span>${t("Ventas")}</span><strong class="stat-money">${money(sold)}</strong></article>
      <article class="stat"><span>${t("Por despachar")}</span><strong>${pending}</strong></article>
      <article class="stat"><span>${t("Por reponer")}</span><strong>${low.length}</strong></article>
    </div>
    <div class="chart-grid">
      <article class="admin-block"><p class="eyebrow">${t("Ventas por mes")}</p><p class="admin-note">${t("Seis meses, con los ejemplos y los pedidos de este navegador.")}</p>${barChart(byMonth, t("Ventas de los últimos seis meses"))}</article>
      <article class="admin-block"><p class="eyebrow">${t("Ventas por línea")}</p><div class="${desk.linesOpen ? "legend-scroll" : ""}">${lineMeters(shownLines)}</div><button class="btn btn-ghost" type="button" data-lines-toggle>${desk.linesOpen ? t("Ver menos") : t("Ver todas")}</button><p class="admin-note">${restock}</p></article>
    </div>
    <article class="admin-block"><p class="eyebrow">${t("Estado de pedidos")}</p>${meterList(byStatus.map((part) => ({ ...part, label: statusLabel(part.label) })))}</article>`;

  const salePages = Math.max(1, Math.ceil(list.length / 8));
  desk.ventasPage = Math.min(Math.max(1, desk.ventasPage), salePages);
  const saleSlice = list.slice((desk.ventasPage - 1) * 8, desk.ventasPage * 8);
  const saleRows = saleSlice.length
    ? saleSlice.map((order) => `<tr><td>${escapeHtml(order.id)}${order.example ? `<span class="example-tag">${t("Ejemplo")}</span>` : ""}</td><td>${new Date(order.date).toLocaleDateString(lang() === "en" ? "en-US" : "es-CO", { day: "2-digit", month: "short", year: "numeric" })}</td><td>${escapeHtml(order.customer.nombre)}<br>${escapeHtml(order.customer.institucion || "")}</td><td>${escapeHtml(order.customer.ciudad)}<br>${escapeHtml(order.customer.metodo || "")}</td><td>${money(order.total)}</td><td><select class="status-select" data-status="${escapeHtml(order.id)}">${statusOptions(order.status)}</select></td></tr>`).join("")
    : `<tr><td colspan="6">${t("Todavía no hay pedidos.")}</td></tr>`;
  sales.innerHTML = `<div class="chart-grid chart-grid-sales"><article class="admin-block"><p class="eyebrow">${t("Ventas por mes")}</p>${barChart(byMonth, t("Ventas de los últimos seis meses"))}</article><article class="admin-block"><p class="eyebrow">${t("Por cobrar y despachar")}</p><p class="admin-note">${t("Total")} ${money(sold)}. ${pending} ${t("siguen abiertos.")}</p>${meterList(byStatus.map((part) => ({ ...part, label: statusLabel(part.label) })))}</article></div><div class="admin-block"><p class="eyebrow">${t("Pedidos")}</p><p class="admin-note">${t("Una compra confirmada entra en esta tabla. El precio queda a consultar hasta que el asesor lo cierre.")}</p><div class="table-wrap"><table class="admin-table"><thead><tr><th>${t("Pedido")}</th><th>${t("Fecha")}</th><th>${t("Cliente")}</th><th>${t("Ciudad")}</th><th>${t("Total")}</th><th>${t("Estado")}</th></tr></thead><tbody>${saleRows}</tbody></table></div><div class="pager"><button class="btn btn-ghost" type="button" data-ventas-page="prev" ${desk.ventasPage <= 1 ? "disabled" : ""}>${t("Anterior")}</button><span>${t("Página")} ${desk.ventasPage} ${t("de")} ${salePages}</span><button class="btn btn-ghost" type="button" data-ventas-page="next" ${desk.ventasPage >= salePages ? "disabled" : ""}>${t("Siguiente")}</button></div></div>`;

  const bodegaFiltered = PRODUCTS.filter((item) => {
    if (desk.bodegaLine !== "todas" && item.line !== desk.bodegaLine) return false;
    const query = desk.bodegaQuery.trim().toLowerCase();
    return !query || `${item.id} ${item.name} ${item.line}`.toLowerCase().includes(query);
  });
  const bodegaPages = Math.max(1, Math.ceil(bodegaFiltered.length / 12));
  desk.bodegaPage = Math.min(Math.max(1, desk.bodegaPage), bodegaPages);
  const bodegaSlice = bodegaFiltered.slice((desk.bodegaPage - 1) * 12, desk.bodegaPage * 12);
  const openItem = desk.bodegaId ? product(desk.bodegaId) : null;
  const sheet = (item) => {
    const ficha = fichaDe(item.id);
    const cop = savedPrice(item);
    const price = cop ? String(Math.round(cop)) : "";
    const dollars = savedUsd(item);
    const usd = dollars ? String(dollars) : "";
    const place = ficha.place != null ? ficha.place : (item.place || "");
    const note = ficha.note || "";
    const minimum = ficha.min != null ? ficha.min : item.min;
    const left = stock[item.id] ?? 0;
    return `<article class="admin-block product-sheet"><div class="sheet-photo"><img src="${productImage(item)}" alt="${escapeHtml(item.name)}" data-product="${item.id}"><label class="btn btn-ghost sheet-file">${t("Cambiar imagen")}<input data-sheet-photo="${item.id}" type="file" accept="image/*"></label><p class="admin-note">${t("La foto se ajusta sola: tamaño, resolución e iluminación.")}</p></div><form class="panel-form" data-sheet-form="${item.id}"><p class="eyebrow">${item.id}</p><h2>${escapeHtml(item.name)}</h2><p class="admin-note">${escapeHtml(item.line)}</p><div class="price-pair"><label>${t("Precio COP")}<input name="price" data-price-cop inputmode="decimal" value="${escapeHtml(price)}" placeholder="${t("A consultar")}" autocomplete="off"></label><label>${t("Precio USD")}<input name="usd" data-price-usd inputmode="decimal" value="${escapeHtml(usd)}" placeholder="${t("A consultar")}" autocomplete="off"></label></div><p class="admin-note" data-trm-note>${escapeHtml(trmNote())}</p><label>${t("Existencia")}<input name="qty" type="number" min="0" value="${left}"></label><label>${t("Mínimo")}<input name="min" type="number" min="0" value="${minimum}"></label><label>${t("Ubicación")}<input name="place" value="${escapeHtml(place)}"></label><label>${t("Nota")}<textarea name="note" rows="3">${escapeHtml(note)}</textarea></label><p data-sheet-status>${escapeHtml(desk.fichaNote)}</p><div class="catalog-actions"><button class="btn btn-metal" type="submit">${t("Guardar ficha")}</button><button class="btn btn-ghost" type="button" data-bodega-close>${t("Volver a la lista")}</button></div></form></article>`;
  };
  const bodegaRows = bodegaSlice.map((item) => {
    const left = stock[item.id] ?? 0;
    const minimum = fichaDe(item.id).min != null ? Number(fichaDe(item.id).min) : item.min;
    const warn = left <= minimum;
    return `<tr class="bodega-row${warn ? " low" : ""}" data-bodega-open="${item.id}"><td>${item.id}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.line)}</td><td>${left}</td><td>${warn ? t("Reponer") : t("Disponible")}</td></tr>`;
  }).join("") || `<tr><td colspan="5">${t("Sin coincidencias.")}</td></tr>`;
  const lineOptions = [`<option value="todas">${t("Todas")}</option>`, ...LINES.map((line) => `<option value="${escapeHtml(line)}" ${desk.bodegaLine === line ? "selected" : ""}>${escapeHtml(line)}</option>`)].join("");
  warehouse.innerHTML = openItem
    ? sheet(openItem)
    : `<div class="admin-block"><p class="eyebrow">${t("Imágenes del catálogo")}</p><p class="admin-note">${t("Suba la carpeta, un zip o la foto de una referencia. Al entrar, la imagen se recorta al tamaño de ficha, se aclara si viene oscura y queda lista para el celular.")}</p><div class="photo-drop" data-photo-drop><p>${t("Suelte aquí la carpeta o las imágenes.")}</p><div class="photo-actions"><label class="btn btn-metal">${t("Subir carpeta")}<input data-photo-folder type="file" webkitdirectory mozdirectory directory multiple></label><label class="btn btn-ghost">${t("Elegir imágenes o zip")}<input data-photo-files type="file" accept="image/*,.zip" multiple></label><button class="btn btn-ghost" type="button" data-photo-clear>${t("Quitar cargadas")}</button></div></div><p data-photo-status></p></div><div class="admin-block"><div class="desk-tools"><label>${t("Buscar")}<input data-bodega-search type="search" value="${escapeHtml(desk.bodegaQuery)}" placeholder="${t("Referencia o nombre")}" autocomplete="off"></label><label>${t("Línea")}<select data-bodega-line>${lineOptions}</select></label></div><div class="table-wrap"><table class="admin-table"><thead><tr><th>Ref.</th><th>${t("Artículo")}</th><th>${t("Línea")}</th><th>${t("Existencia")}</th><th>${t("Estado")}</th></tr></thead><tbody>${bodegaRows}</tbody></table></div><div class="pager"><button class="btn btn-ghost" type="button" data-bodega-page="prev" ${desk.bodegaPage <= 1 ? "disabled" : ""}>${t("Anterior")}</button><span>${t("Página")} ${desk.bodegaPage} ${t("de")} ${bodegaPages}</span><button class="btn btn-ghost" type="button" data-bodega-page="next" ${desk.bodegaPage >= bodegaPages ? "disabled" : ""}>${t("Siguiente")}</button></div></div>`;

  const trace = document.querySelector('[data-admin-panel="trazabilidad"]');
  if (trace) trace.innerHTML = traceBoard();

  const settings = document.querySelector('[data-admin-panel="configuracion"]');
  if (settings) {
    const internalText = internalBase() ? `${t("La comunicación apunta a")} ${internalBase()}.` : t("La comunicación queda abierta. Aún no hay dirección.");
    settings.innerHTML = `<div class="chart-grid">
      <article class="admin-block"><p class="eyebrow">${t("Asesor comercial")}</p><p class="admin-note">${t("Este WhatsApp recibe los pedidos y atiende el botón del sitio.")}</p><form class="panel-form" data-wa-form><label>${t("Número")}<input name="wa" inputmode="numeric" autocomplete="tel" required value="${escapeHtml(localPhone)}"></label><button class="btn btn-metal" type="submit">${t("Guardar número")}</button></form><p data-wa-status></p></article>
      <article class="admin-block"><p class="eyebrow">${t("Pasarela Wompi")}</p><p class="admin-note">${t("Cuando el comercio tenga las llaves, péguelas aquí. El pago en línea del pedido usa esa pasarela.")}</p><form class="panel-form" data-wompi-form><label>${t("Llave pública")}<input name="publicKey" autocomplete="off" value="${escapeHtml(wompi.publicKey)}" placeholder="pub_test_ o pub_prod_"></label><label>${t("Secreto de integridad")}<input name="integrity" autocomplete="off" value="${escapeHtml(wompi.integrity)}"></label><button class="btn btn-metal" type="submit">${t("Guardar Wompi")}</button></form><p data-wompi-status>${wompi.publicKey && wompi.integrity ? t("Wompi está listo para cobrar en el pedido.") : t("Wompi queda abierto hasta tener las llaves.")}</p></article>
      <article class="admin-block span-row"><p class="eyebrow">${t("Aplicación interna")}</p><p class="admin-note">${t("A partir de diciembre o enero este sitio le enviará pedidos, existencia, el WhatsApp del asesor, el aviso de pago y la trazabilidad. Pegue la dirección cuando el software exista. Vacía, la compra sigue en este navegador.")}</p><form class="panel-form" data-internal-form><label>${t("Dirección")}<input name="base" inputmode="url" autocomplete="off" placeholder="https://api.deltactica.com" value="${escapeHtml(internalBase())}"></label><button class="btn btn-metal" type="submit">${t("Guardar dirección")}</button></form><p data-internal-status>${escapeHtml(internalText)}</p></article>
    </div>`;
  }

  const catalog = document.querySelector('[data-admin-panel="catalogo"]');
  if (catalog) {
    if (!desk.catalogLines) desk.catalogLines = new Set(LINES);
    const counts = Object.fromEntries(LINES.map((line) => [line, PRODUCTS.filter((item) => item.line === line).length]));
    const allOn = LINES.every((line) => desk.catalogLines.has(line));
    const chips = [
      `<button class="filter${allOn ? " is-active" : ""}" type="button" data-line-filter="todas" aria-pressed="${allOn ? "true" : "false"}">${t("Todas")} <b>${PRODUCTS.length}</b></button>`,
      ...LINES.map((line) => `<button class="filter${desk.catalogLines.has(line) ? " is-active" : ""}" type="button" data-line-filter="${escapeHtml(line)}" aria-pressed="${desk.catalogLines.has(line) ? "true" : "false"}">${escapeHtml(line)} <b>${counts[line]}</b></button>`)
    ].join("");
    catalog.innerHTML = `<div class="admin-block catalog-desk"><p class="eyebrow">${t("Descargar catálogo")}</p><p class="admin-note">${t("Combine líneas o busque una referencia. Descargue el catálogo completo o solo lo que dejó filtrado.")}</p><div class="catalog-tools"><label class="catalog-search">${t("Buscar")}<input data-catalog-search type="search" placeholder="${t("Referencia o nombre")}" autocomplete="off" value="${escapeHtml(desk.catalogQuery || "")}"></label><div class="filters catalog-lines" role="group" aria-label="${t("Líneas del PDF")}">${chips}</div></div><p class="count" data-download-count></p><div class="download-picks" data-download-list></div><div class="catalog-actions"><button class="btn btn-metal" type="button" data-download-catalog data-download-mode="filtrado">${t("Descargar filtrado")}</button><button class="btn btn-ghost" type="button" data-download-catalog data-download-mode="completo">${t("Descargar completo")}</button></div><p data-download-status></p></div>`;
    paintDownloadCount();
  }

  const tabs = [...document.querySelectorAll("[data-admin-tab]")];
  const panels = [...document.querySelectorAll("[data-admin-panel]")];
  const names = tabs.map((tab) => tab.dataset.adminTab);
  const show = (name) => {
    const current = names.includes(name) ? name : "general";
    tabs.forEach((tab) => tab.classList.toggle("is-on", tab.dataset.adminTab === current));
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.adminPanel !== current;
    });
    if (location.hash !== `#${current}`) history.replaceState(null, "", `#${current}`);
  };
  shell._show = show;
  if (!shell.dataset.ready) {
    shell.dataset.ready = "1";
    tabs.forEach((tab) => tab.addEventListener("click", (event) => {
      event.preventDefault();
      shell._show(tab.dataset.adminTab);
    }));
  }
  show((location.hash || "#general").slice(1));
  paintLang();
  paintPhotoDesk();
  applyPhotos();
  if (desk.focus === "bodega") {
    const input = document.querySelector("[data-bodega-search]");
    if (input) {
      input.focus();
      const end = input.value.length;
      input.setSelectionRange(end, end);
    }
    desk.focus = "";
  }
}

document.addEventListener("click", (event) => {
  const langButton = event.target.closest("[data-lang]");
  if (langButton) {
    const choice = langButton.dataset.lang;
    localStorage.setItem(KEYS.lang, choice === "en" || choice === "zh" ? choice : "es");
    if (document.querySelector("[data-admin-login]")) renderAdmin();
    renderCart();
    renderCheckout();
    paintAccount();
    if (window.dtRepintarProbador) window.dtRepintarProbador();
    paintLang();
    if (window.dtApplyCatalog) window.dtApplyCatalog();
    if (window.dtNavLabel) window.dtNavLabel();
    return;
  }
  if (event.target.closest("[data-lines-toggle]")) {
    desk.linesOpen = !desk.linesOpen;
    renderAdmin();
    return;
  }
  const bodegaOpen = event.target.closest("[data-bodega-open]");
  if (bodegaOpen) {
    desk.bodegaId = bodegaOpen.dataset.bodegaOpen;
    desk.fichaNote = "";
    renderAdmin();
    return;
  }
  if (event.target.closest("[data-bodega-close]")) {
    desk.bodegaId = "";
    desk.fichaNote = "";
    renderAdmin();
    return;
  }
  const bodegaPage = event.target.closest("[data-bodega-page]");
  if (bodegaPage && !bodegaPage.disabled) {
    desk.bodegaPage += bodegaPage.dataset.bodegaPage === "next" ? 1 : -1;
    renderAdmin();
    return;
  }
  const ventasPage = event.target.closest("[data-ventas-page]");
  if (ventasPage && !ventasPage.disabled) {
    desk.ventasPage += ventasPage.dataset.ventasPage === "next" ? 1 : -1;
    renderAdmin();
    return;
  }
  const lineFilter = event.target.closest("[data-filter]");
  if (lineFilter && lineFilter.dataset.filter !== "todos") {
    rememberTrace({ a: "filtro", p: "Catálogo", d: lineFilter.dataset.filter });
  }
  if (event.target.closest(".wa-fab, [data-wa-text]")) {
    rememberTrace({ a: "asesor", d: "whatsapp" });
  }
  const accountToggle = event.target.closest("[data-account-toggle]");
  if (accountToggle) {
    if (!currentUser()) {
      const login = document.querySelector("[data-admin-login]");
      if (login && !login.hidden) {
        login.querySelector("[name=clave]")?.focus();
        return;
      }
      location.href = `${root}admin.html`;
      return;
    }
    const menu = accountToggle.parentElement.querySelector("[data-account-menu]");
    const willOpen = menu.hidden;
    closeAccounts();
    menu.hidden = !willOpen;
    accountToggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
    return;
  }
  if (event.target.closest("[data-logout]")) {
    logout();
    return;
  }
  if (!event.target.closest("[data-account]")) closeAccounts();
  const add = event.target.closest("[data-add]");
  if (add) {
    event.preventDefault();
    event.stopPropagation();
    const scope = add.closest(".hero-actions, .card-body, .tile") || document;
    const qty = scope.querySelector("[data-qty]");
    const addedQty = qty ? qty.value : 1;
    const message = addToCart(add.dataset.add, addedQty);
    String(add.dataset.addJunto || "").split(/\s+/).filter(Boolean).forEach((id) => addToCart(id, addedQty));
    if (!message) rememberTrace({ a: "carrito", d: add.dataset.add, n: Number(addedQty) || 1 });
    const previous = add.textContent;
    add.textContent = message || "Añadido al carrito";
    window.setTimeout(() => {
      add.textContent = previous;
    }, 1400);
    return;
  }
  const change = event.target.closest("[data-qty-change]");
  if (change) {
    const line = cart().find((item) => item.id === change.dataset.qtyChange);
    const message = setQty(change.dataset.qtyChange, (line?.qty || 0) + Number(change.dataset.dir));
    renderCart();
    const note = document.querySelector("[data-cart-msg]");
    if (note && message) note.textContent = message;
    return;
  }
  const remove = event.target.closest("[data-remove]");
  if (remove) {
    setQty(remove.dataset.remove, 0);
    renderCart();
    return;
  }
  if (event.target.closest("[data-clear-cart]")) {
    saveCart([]);
    renderCart();
    return;
  }
  const receiptPdf = event.target.closest("[data-download-receipt]");
  if (receiptPdf) {
    const order = orders().find((item) => item.id === receiptPdf.dataset.downloadReceipt);
    if (order) {
      receiptPdf.disabled = true;
      downloadReceipt(order).catch(() => {}).finally(() => {
        receiptPdf.disabled = false;
      });
    }
    return;
  }
  const lineButton = event.target.closest("[data-line-filter]");
  if (lineButton) {
    const buttons = [...document.querySelectorAll("[data-line-filter]")];
    const rest = buttons.filter((button) => button.dataset.lineFilter !== "todas");
    const all = buttons.find((button) => button.dataset.lineFilter === "todas");
    const mark = (button, on) => {
      button.setAttribute("aria-pressed", on ? "true" : "false");
      button.classList.toggle("is-active", on);
    };
    if (lineButton.dataset.lineFilter === "todas") {
      const on = lineButton.getAttribute("aria-pressed") !== "true";
      buttons.forEach((button) => mark(button, on));
    } else {
      mark(lineButton, lineButton.getAttribute("aria-pressed") !== "true");
      if (all) mark(all, rest.every((button) => button.getAttribute("aria-pressed") === "true"));
    }
    desk.catalogLines = new Set(rest.filter((button) => button.getAttribute("aria-pressed") === "true").map((button) => button.dataset.lineFilter));
    paintDownloadCount();
    return;
  }
  if (event.target.closest("[data-download-catalog]")) {
    const button = event.target.closest("[data-download-catalog]");
    const mode = button.dataset.downloadMode || "filtrado";
    const items = mode === "completo" ? PRODUCTS : catalogSelection();
    const status = document.querySelector("[data-download-status]");
    if (!items.length) {
      if (status) status.textContent = t("Elija al menos una línea.");
      return;
    }
    if (status) status.textContent = t("Se está armando el PDF.");
    saveCatalog(mode).then((name) => {
      if (status) status.textContent = `${t("Se descargó")} ${name}.`;
    }).catch(() => {
      if (status) status.textContent = t("No se pudo armar el PDF.");
    });
    return;
  }
  const removePhotoButton = event.target.closest("[data-photo-remove]");
  if (removePhotoButton) {
    removePhoto(removePhotoButton.dataset.photoRemove).then(() => {
      paintPhotoDesk();
      applyPhotos();
      document.querySelectorAll("img[data-photo-base]").forEach((img) => {
        const match = (img.dataset.photoBase || "").match(/productos\/(dt-\d{2})\./i);
        if (match && match[1].toUpperCase() === removePhotoButton.dataset.photoRemove) img.src = img.dataset.photoBase;
      });
    });
    return;
  }
  if (event.target.closest("[data-photo-clear]")) {
    clearPhotos().then(() => {
      document.querySelectorAll("img[data-photo-base]").forEach((img) => {
        img.src = img.dataset.photoBase;
      });
      paintPhotoDesk();
      const status = document.querySelector("[data-photo-status]");
      if (status) status.textContent = t("Se quitaron las imágenes cargadas. El catálogo volvió a las fotos del sitio.");
    });
  }
});

function selectedLines() {
  return [...document.querySelectorAll("[data-line-filter]")]
    .filter((button) => button.dataset.lineFilter !== "todas" && button.getAttribute("aria-pressed") === "true")
    .map((button) => button.dataset.lineFilter);
}

function catalogSelection() {
  const lines = selectedLines();
  const query = (document.querySelector("[data-catalog-search]")?.value || "").trim().toLowerCase();
  return PRODUCTS.filter((item) => lines.includes(item.line) && (!query || `${item.id} ${item.name} ${item.line}`.toLowerCase().includes(query)));
}

function paintDownloadCount() {
  const count = document.querySelector("[data-download-count]");
  const list = document.querySelector("[data-download-list]");
  if (!count || !list) return;
  const items = catalogSelection();
  count.textContent = items.length === 1 ? `1 ${t("referencia")}` : `${items.length} ${t("referencias")}`;
  const preview = items.slice(0, 6);
  const extra = items.length - preview.length;
  list.innerHTML = preview.length
    ? `${preview.map((item) => `<span>${item.id} · ${escapeHtml(item.name)}</span>`).join("")}${extra ? `<span>${extra} ${t("y más en el PDF.")}</span>` : ""}`
    : `<span>${t("Elija al menos una línea.")}</span>`;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function catalogPhoto(id) {
  const db = await photoDb();
  const blob = await new Promise((resolve, reject) => {
    const request = db.transaction("photos", "readonly").objectStore("photos").get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
  const item = product(id);
  if (!item) return "";
  if (blob) return blobToDataUrl(blob);
  return new URL(item.image, location.href).href;
}

async function catalogFile(items, lines) {
  const stock = stockMap();
  const cards = (await Promise.all(items.map(async (item) => {
    const photo = await catalogPhoto(item.id);
    return `<article>
      <img src="${photo}" alt="">
      <div>
        <p>${escapeHtml(item.id)} · ${escapeHtml(item.line)}</p>
        <h2>${escapeHtml(item.name)}</h2>
        <p>${escapeHtml(NOTES[item.id] || "")}</p>
        <p>${priceLabel(item)} · Existencia ${stock[item.id] ?? 0} · ${escapeHtml(item.place)}</p>
      </div>
    </article>`;
  }))).join("");
  const title = lines.length === LINES.length ? "Catálogo completo" : lines.join(", ");
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Deltactica · ${escapeHtml(title)}</title>
  <style>
    body { margin: 0; font-family: Georgia, serif; color: #161616; background: #fff; }
    header, main { width: min(860px, calc(100% - 32px)); margin: 24px auto; }
    h1 { font-size: 40px; letter-spacing: 0.04em; text-transform: uppercase; margin: 8px 0; }
    article { display: grid; grid-template-columns: 140px 1fr; gap: 16px; padding: 16px 0; border-top: 1px solid #ccc; break-inside: avoid; }
    img { width: 140px; height: 140px; object-fit: cover; }
    h2 { margin: 0 0 8px; font-size: 26px; text-transform: uppercase; }
    p { margin: 0 0 6px; }
    .bar { display: flex; justify-content: space-between; align-items: center; }
    button { font: inherit; padding: 10px 14px; }
    @media print { .bar button { display: none; } }
  </style>
</head>
<body>
  <header>
    <div class="bar"><p>Deltactica</p><button type="button" onclick="window.print()">Imprimir o guardar PDF</button></div>
    <h1>${escapeHtml(title)}</h1>
    <p>${items.length} referencias. Artículos tácticos y militares.</p>
  </header>
  <main>${cards}</main>
</body>
</html>`;
}

async function saveCatalog(mode) {
  const picked = mode === "completo" ? PRODUCTS.slice() : catalogSelection();
  const lines = [...new Set(picked.map((item) => item.line))];
  const items = picked;
  const assets = await brandAssets();
  const query = mode === "completo" ? "" : (document.querySelector("[data-catalog-search]")?.value || "").trim();
  const title = mode === "completo"
    ? t("Catálogo completo")
    : query
      ? `Búsqueda: ${query}`
      : lines.length === LINES.length ? t("Catálogo completo") : lines.join(", ");
  const sheets = [];
  for (const item of items) {
    const src = productImage(item);
    const photo = await window.DTPDF.loadJpeg(src, "#f3f4f5").catch(() => null);
    sheets.push({ id: item.id, name: item.name, line: item.line, note: fichaDe(item.id).note || NOTES[item.id] || "", price: savedPrice(item), usd: savedUsd(item), priceText: priceLabel(item), photo });
  }
  const blob = await window.DTPDF.catalog(sheets, { ...assets, title });
  const slug = query ? "busqueda" : lines.length === LINES.length ? "completo" : lines.map((line) => line.toLowerCase()).join("-");
  const name = `deltactica-catalogo-${slug}.pdf`;
  downloadBlob(blob, name);
  return name;
}

document.addEventListener("change", (event) => {
  const photoInput = event.target.closest("[data-photo-folder], [data-photo-files]");
  if (photoInput) {
    const files = [...photoInput.files];
    photoInput.value = "";
    expandUploads(files).then((ready) => savePhotoFiles(ready)).then((result) => {
      paintPhotoDesk();
      applyPhotos();
      photoStatus(result.matched, result.skipped);
    }).catch(() => {
      const status = document.querySelector("[data-photo-status]");
      if (status) status.textContent = t("No se pudo leer la carpeta en este navegador.");
    });
    return;
  }
  const sheetPhoto = event.target.closest("[data-sheet-photo]");
  if (sheetPhoto && sheetPhoto.files && sheetPhoto.files[0]) {
    const id = sheetPhoto.dataset.sheetPhoto;
    preparePhoto(sheetPhoto.files[0]).then((blob) => savePhotoBlob(id, blob)).then(() => {
      desk.bodegaId = id;
      desk.fichaNote = t("Ficha guardada.");
      renderAdmin();
      applyPhotos();
    });
    return;
  }
  const bodegaLine = event.target.closest("[data-bodega-line]");
  if (bodegaLine) {
    desk.bodegaLine = bodegaLine.value;
    desk.bodegaPage = 1;
    renderAdmin();
    return;
  }
  const select = event.target.closest("[data-status]");
  if (select) {
    const next = orders().map((order) => (
      order.id === select.dataset.status ? { ...order, status: select.value } : order
    ));
    write(KEYS.orders, next);
    const changed = next.find((order) => order.id === select.dataset.status);
    if (changed && !changed.example) notifyInternal("estado", { id: changed.id, estado: changed.status });
    renderAdmin();
    return;
  }
});

let catalogSearchTimer = 0;
document.addEventListener("input", (event) => {
  const copInput = event.target.closest("[data-price-cop]");
  const usdInput = event.target.closest("[data-price-usd]");
  if (copInput || usdInput) {
    const form = event.target.form;
    const copField = form && form.querySelector("[data-price-cop]");
    const usdField = form && form.querySelector("[data-price-usd]");
    if (copInput) {
      desk.priceSide = "cop";
      const dollars = copToUsd(readAmount(copInput.value));
      if (usdField && trmRate()) usdField.value = dollars ? String(dollars) : "";
    } else {
      desk.priceSide = "usd";
      const pesos = usdToCop(readAmount(usdInput.value));
      if (copField && trmRate()) copField.value = pesos ? String(pesos) : "";
    }
    return;
  }
  const bodegaSearch = event.target.closest("[data-bodega-search]");
  if (bodegaSearch) {
    desk.bodegaQuery = bodegaSearch.value;
    desk.bodegaPage = 1;
    desk.focus = "bodega";
    renderAdmin();
    return;
  }
  const catalogSearch = event.target.closest("[data-catalog-search]");
  if (catalogSearch) desk.catalogQuery = catalogSearch.value;
  if (event.target.closest("[data-catalog-search]")) paintDownloadCount();
  const catalogQuery = event.target.closest("[data-catalog-query]");
  if (!catalogQuery) return;
  window.clearTimeout(catalogSearchTimer);
  catalogSearchTimer = window.setTimeout(() => {
    const text = catalogQuery.value.trim();
    if (text.length >= 2) rememberTrace({ a: "buscar", p: "Catálogo", d: text });
  }, 700);
});

document.addEventListener("submit", (event) => {
  const sheet = event.target.closest("[data-sheet-form]");
  if (sheet) {
    event.preventDefault();
    const id = sheet.dataset.sheetForm;
    const data = new FormData(sheet);
    let price = Math.round(readAmount(data.get("price")));
    let usd = Math.round(readAmount(data.get("usd")) * 100) / 100;
    if (trmRate()) {
      if (desk.priceSide === "usd" && usd) price = usdToCop(usd);
      if (price) usd = copToUsd(price);
      else if (usd) price = usdToCop(usd);
    }
    const fichas = read(KEYS.ficha, {});
    fichas[id] = {
      price,
      usd,
      trm: trmRate() || undefined,
      place: String(data.get("place") || "").trim(),
      note: String(data.get("note") || "").trim(),
      min: Math.max(0, Number(data.get("min")) || 0),
    };
    write(KEYS.ficha, fichas);
    const stock = stockMap();
    stock[id] = Math.max(0, Number(data.get("qty")) || 0);
    write(KEYS.stock, stock);
    notifyInternal("existencia", stock);
    desk.bodegaId = id;
    desk.fichaNote = t("Ficha guardada.");
    renderAdmin();
    return;
  }
  const waForm = event.target.closest("[data-wa-form]");
  if (waForm) {
    event.preventDefault();
    const status = waForm.parentElement.querySelector("[data-wa-status]");
    const phone = normalizePhone(new FormData(waForm).get("wa"));
    if (!phone) {
      if (status) status.textContent = t("Escriba el celular del asesor. Ejemplo: 3227043082.");
      return;
    }
    localStorage.setItem(KEYS.wa, phone);
    applyAdvisorPhone();
    notifyInternal("asesor", { whatsapp: phone });
    if (status) status.textContent = `${t("El asesor atiende en")} ${prettyPhone(phone)}.`;
    return;
  }
  const wompiForm = event.target.closest("[data-wompi-form]");
  if (wompiForm) {
    event.preventDefault();
    const data = new FormData(wompiForm);
    const publicKey = String(data.get("publicKey") || "").trim();
    const integrity = String(data.get("integrity") || "").trim();
    write(KEYS.wompi, { publicKey, integrity });
    notifyInternal("pago", { pasarela: "wompi", lista: Boolean(publicKey && integrity) });
    const status = wompiForm.parentElement.querySelector("[data-wompi-status]");
    if (status) status.textContent = publicKey && integrity ? t("Wompi está listo para cobrar en el pedido.") : t("Wompi queda abierto hasta tener las llaves.");
    return;
  }
  const internalForm = event.target.closest("[data-internal-form]");
  if (internalForm) {
    event.preventDefault();
    const status = internalForm.parentElement.querySelector("[data-internal-status]");
    const saved = saveInternalBase(new FormData(internalForm).get("base"));
    if (saved === null) {
      if (status) status.textContent = t("Escriba una dirección http o https. Ejemplo: https://api.deltactica.com");
      return;
    }
    if (status) status.textContent = saved ? `${t("La comunicación apunta a")} ${saved}.` : t("La comunicación queda abierta. Aún no hay dirección.");
    return;
  }
  const form = event.target.closest("[data-stock-form]");
  if (!form) return;
  event.preventDefault();
  const stock = stockMap();
  stock[form.dataset.stockForm] = Math.max(0, Number(new FormData(form).get("qty")) || 0);
  write(KEYS.stock, stock);
  notifyInternal("existencia", stock);
  renderAdmin();
});

document.addEventListener("dragover", (event) => {
  if (!event.target.closest("[data-photo-drop]")) return;
  event.preventDefault();
});

document.addEventListener("drop", (event) => {
  const zone = event.target.closest("[data-photo-drop]");
  if (!zone) return;
  event.preventDefault();
  const dropped = event.dataTransfer;
  filesFromList([...dropped.items]).then((entries) => {
    const files = entries.length ? entries : [...dropped.files];
    return expandUploads(files).then((ready) => savePhotoFiles(ready));
  }).then((result) => {
    paintPhotoDesk();
    applyPhotos();
    photoStatus(result.matched, result.skipped);
  }).catch(() => {
    const status = document.querySelector("[data-photo-status]");
    if (status) status.textContent = t("No se pudo leer esa carpeta. Use el botón Subir carpeta.");
  });
});

const DT_GRUPOS = [
  { nombre: "Dona", piezas: ["DT-1004", "DT-1005"], etiquetas: { "DT-1004": "Grande", "DT-1005": "Mediana" }, nota: "Grande y mediana tienen el mismo costo." },
  { nombre: "Medias veladas", piezas: ["DT-1028", "DT-1027"], etiquetas: { "DT-1028": "Pistacho", "DT-1027": "Brown" }, nota: "La misma referencia. Cambia el color." },
  { nombre: "Bolso M-1", piezas: ["DT-1031", "DT-1030"], etiquetas: { "DT-1031": "Verde", "DT-1030": "Negro" } },
  { nombre: "Chapuza externa lona", piezas: ["DT-1032", "DT-1033"], etiquetas: { "DT-1032": "Pistola", "DT-1033": "Revólver" }, nota: "La misma chapuza. Sirve para pistola o revólver." },
  { nombre: "Chapuza interna lona", piezas: ["DT-1037", "DT-1034"], etiquetas: { "DT-1037": "Pistola larga", "DT-1034": "Pistola corta" } },
  { nombre: "Chapuza interna revólver", piezas: ["DT-1036", "DT-1035"], etiquetas: { "DT-1036": "Larga", "DT-1035": "Corta" } },
  { nombre: "Detodito amplio", piezas: ["DT-1039", "DT-1038"], etiquetas: { "DT-1039": "Verde", "DT-1038": "Gris" } },
  { nombre: "Detodito compacto", piezas: ["DT-1041", "DT-1040"], etiquetas: { "DT-1041": "Verde", "DT-1040": "Gris" } },
  { nombre: "Porta proveedor de fusil táctico doble", piezas: ["DT-1050", "DT-1049"], etiquetas: { "DT-1050": "Verde", "DT-1049": "Negro" }, apoyo: ["DT-1048", "DT-1047"], etiquetasApoyo: { "DT-1048": "De lado verde", "DT-1047": "De lado negro" }, nota: "La foto de lado muestra cómo se ve con los dos proveedores." },
  { nombre: "Porta torniquete táctico", piezas: ["DT-1057", "DT-1056"], etiquetas: { "DT-1057": "Verde", "DT-1056": "Negro" } },
  { nombre: "Porta celular vertical", piezas: ["DT-1062", "DT-1063", "DT-1061"], etiquetas: { "DT-1062": "Verde", "DT-1063": "Gris", "DT-1061": "Velcro" } },
  { nombre: "Porta celular horizontal", piezas: ["DT-1060", "DT-1058", "DT-1059"], etiquetas: { "DT-1060": "Verde", "DT-1058": "Gris", "DT-1059": "Velcro" } },
  { nombre: "Cartucho de seguridad", piezas: ["DT-1065", "DT-1066"], etiquetas: { "DT-1065": "Fusil", "DT-1066": "Pistola" } },
  { nombre: "Grip de pistola", piezas: ["DT-1069", "DT-1068", "DT-1067"], etiquetas: { "DT-1069": "Verde", "DT-1068": "Negro", "DT-1067": "Kaki" } },
  { nombre: "Kit de limpieza armas cortas", piezas: ["DT-1073", "DT-1074"], etiquetas: { "DT-1073": "Letal", "DT-1074": "Traumáticas" }, apoyo: ["DT-1071", "DT-1072"], etiquetasApoyo: { "DT-1071": "Letal abierto", "DT-1072": "Traumáticas abierto" }, nota: "Las fotos abiertas muestran cómo viene y qué trae." },
  { nombre: "Ligas delgadas", piezas: ["DT-1083", "DT-1082"], etiquetas: { "DT-1083": "Verdes", "DT-1082": "Negras" } },
  { nombre: "Pañoleta bordada", piezas: ["DT-1085", "DT-1086", "DT-1084"], etiquetas: { "DT-1085": "#4 verde", "DT-1086": "#5 verde", "DT-1084": "#4 azul" } },
  { nombre: "Sábana cama sencilla", piezas: ["DT-1091", "DT-1090", "DT-1089"], etiquetas: { "DT-1091": "Verde", "DT-1090": "Negra", "DT-1089": "Blanca" } },
  { nombre: "Shemag táctico", piezas: ["DT-1094", "DT-1093"], etiquetas: { "DT-1094": "Verde", "DT-1093": "Negro" } },
  { nombre: "Toalla", piezas: ["DT-1099", "DT-1098", "DT-1095"], etiquetas: { "DT-1099": "Verde", "DT-1098": "Negra", "DT-1095": "Blanca" } },
  { nombre: "Toalla microfibra", piezas: ["DT-1097", "DT-1096"], etiquetas: { "DT-1097": "Verde", "DT-1096": "Negra" } },
  { nombre: "Chapuza Sig Sauer nivel 2", piezas: ["DT-1100", "DT-1101"], etiquetas: { "DT-1100": "Ajuste bajo", "DT-1101": "Tipo paleta" } },
  { nombre: "Chapuza universal", piezas: ["DT-1103", "DT-1104"], etiquetas: { "DT-1103": "Ajuste bajo", "DT-1104": "Tipo paleta" } },
  { nombre: "Cinturón táctico Molle Milfort", piezas: ["DT-1106", "DT-1105"], etiquetas: { "DT-1106": "Molle", "DT-1105": "Interno" }, junto: true, nota: "Se vende con el cinturón interno. No se manejan por separado." },
  { nombre: "Complemento piernera", piezas: ["DT-1107", "DT-1108", "DT-1109"], etiquetas: { "DT-1107": "G-1", "DT-1108": "G-2 táctico", "DT-1109": "G-2 V2" } },
  { nombre: "Llavero Milfort", piezas: ["DT-1111", "DT-1112"], etiquetas: { "DT-1111": "Pistola", "DT-1112": "Tonfa" } },
  { nombre: "Piernera Milfort", piezas: ["DT-1113", "DT-1114"], etiquetas: { "DT-1113": "G-1", "DT-1114": "G-2" } },
  { nombre: "Porta gorra V2", piezas: ["DT-1119", "DT-1118"], etiquetas: { "DT-1119": "Tapa verde", "DT-1118": "Tapa negra" } },
  { nombre: "Peluches", piezas: ["DT-1132", "DT-1131", "DT-1133"], etiquetas: { "DT-1132": "#4 verde", "DT-1131": "#4 azul", "DT-1133": "#5 verde" } },
  { nombre: "Placa fotograbada", piezas: ["DT-1137", "DT-1138"], etiquetas: { "DT-1137": "Dorada", "DT-1138": "Plateada" } },
  { nombre: "Placa conmemorativa", piezas: ["DT-1134", "DT-1135", "DT-1136"], etiquetas: { "DT-1134": "Grado", "DT-1135": "Escudo PONAL", "DT-1136": "Texto" } },
  { nombre: "Camelback Codra", piezas: ["DT-1144", "DT-1143"], etiquetas: { "DT-1144": "Verde", "DT-1143": "Negro" } },
  { nombre: "Canguro porta arma", piezas: ["DT-1146"], etiquetas: { "DT-1146": "Cerrado" }, apoyo: ["DT-1145"], etiquetasApoyo: { "DT-1145": "Abierto" }, nota: "La foto abierta enseña cómo es el canguro abierto." },
  { nombre: "Morral de campaña", piezas: ["DT-1149", "DT-1148"], etiquetas: { "DT-1149": "Verde", "DT-1148": "Negro" } },
  { nombre: "Morral táctico L-50", piezas: ["DT-1152", "DT-1151", "DT-1150"], etiquetas: { "DT-1152": "Verde", "DT-1151": "Negro", "DT-1150": "Kaki" } },
  { nombre: "Morral táctico M-40", piezas: ["DT-1154", "DT-1153"], etiquetas: { "DT-1154": "Verde", "DT-1153": "Negro" } },
  { nombre: "Morral táctico S-30", piezas: ["DT-1156", "DT-1155"], etiquetas: { "DT-1156": "Verde", "DT-1155": "Negro" } },
  { nombre: "Morral táctico XL-65", piezas: ["DT-1158", "DT-1157"], etiquetas: { "DT-1158": "Verde", "DT-1157": "Negro" } },
  { nombre: "Navaja Pro", piezas: ["DT-1214", "DT-1218", "DT-1216", "DT-1220"], etiquetas: { "DT-1214": "Fire", "DT-1218": "Negra", "DT-1216": "Gris", "DT-1220": "Verde" }, apoyo: ["DT-1213", "DT-1217", "DT-1215", "DT-1219"], etiquetasApoyo: { "DT-1213": "Fire abierta", "DT-1217": "Negra abierta", "DT-1215": "Gris abierta", "DT-1219": "Verde abierta" }, nota: "Cada color tiene la foto de cómo se ve abierta." },
  { nombre: "Esposas nacionales", piezas: ["DT-1265", "DT-1266"], etiquetas: { "DT-1265": "Cadena", "DT-1266": "Grillete" } },
  { nombre: "Portacarnet de cuero", piezas: ["DT-1272", "DT-1271"], etiquetas: { "DT-1272": "Tira verde", "DT-1271": "Tira azul" } },
  { nombre: "Portacarnet de pasta", piezas: ["DT-1273"], etiquetas: { "DT-1273": "Tira azul" }, referencia: [{ id: "DT-1272", etiqueta: "Tira verde" }], nota: "La foto de la tira verde en pasta se perdió. Se muestra la tira verde del portacarnet de cuero." },
  { nombre: "Buzo táctico licrado", piezas: ["DT-1302", "DT-1301", "DT-1300"], etiquetas: { "DT-1302": "Verde", "DT-1301": "Negro", "DT-1300": "Kaki" } },
  { nombre: "Camiseta de algodón importado", piezas: ["DT-1311", "DT-1309", "DT-1310"], etiquetas: { "DT-1311": "Verde", "DT-1309": "Azul", "DT-1310": "Blanca" } },
  { nombre: "Camiseta licrada manga corta", piezas: ["DT-1316", "DT-1315", "DT-1313", "DT-1314"], etiquetas: { "DT-1316": "Verde", "DT-1315": "Negra", "DT-1313": "Azul", "DT-1314": "Blanca" } },
  { nombre: "Camiseta licrada manga larga", piezas: ["DT-1318", "DT-1317"], etiquetas: { "DT-1318": "Verde", "DT-1317": "Negra" } },
  { nombre: "Chaqueta táctica ref. piel de tiburón", piezas: ["DT-1322", "DT-1321"], etiquetas: { "DT-1322": "Verde", "DT-1321": "Negra" } },
  { nombre: "Gafas Oakley fotocromática", piezas: ["DT-1276", "DT-1277"], etiquetas: { "DT-1276": "Chata", "DT-1277": "Murciélago" } },
  { nombre: "Gafas Oakley lente intercambiable", piezas: ["DT-1278", "DT-1279"], etiquetas: { "DT-1278": "Chata", "DT-1279": "Murciélago" } },
  { nombre: "Gafas Oakley polarizado", piezas: ["DT-1281", "DT-1280"], etiquetas: { "DT-1281": "Chata", "DT-1280": "Murciélago" } },
  { nombre: "Guante Ranger abierto", piezas: ["DT-1287", "DT-1286"], etiquetas: { "DT-1287": "Verde", "DT-1286": "Negro" } },
  { nombre: "Guante Ranger cerrado", piezas: ["DT-1289", "DT-1288"], etiquetas: { "DT-1289": "Verde", "DT-1288": "Negro" } },
  { nombre: "Correa 5.11", piezas: ["DT-1341", "DT-1340", "DT-1339"], etiquetas: { "DT-1341": "Verde", "DT-1340": "Negra", "DT-1339": "Kaki" } },
  { nombre: "Correa extracción rápida", piezas: ["DT-1345", "DT-1344", "DT-1343"], etiquetas: { "DT-1345": "Verde", "DT-1344": "Negra", "DT-1343": "Kaki" } },
  { nombre: "Correa interna fina", piezas: ["DT-1346", "DT-1347"], etiquetas: { "DT-1346": "Velcro hembra", "DT-1347": "Velcro macho" }, apoyo: ["DT-1354", "DT-1355"], etiquetasApoyo: { "DT-1354": "Velcro hembra suelto", "DT-1355": "Velcro macho suelto" }, nota: "Las fotos sueltas del velcro sirven para identificar cuál se necesita." },
  { nombre: "Correa piloto B.H", piezas: ["DT-1350", "DT-1349", "DT-1348"], etiquetas: { "DT-1350": "Verde", "DT-1349": "Negra", "DT-1348": "Kaki" } },
  { nombre: "Guindo", piezas: ["DT-1364", "DT-1363"], etiquetas: { "DT-1364": "Verde", "DT-1363": "Negro" } },
  { nombre: "Llavero guaya", piezas: ["DT-1370", "DT-1369", "DT-1368"], etiquetas: { "DT-1370": "Verde", "DT-1369": "Negro", "DT-1368": "Kaki" } },
  { nombre: "Llavero supervivencia", piezas: ["DT-1372", "DT-1371"], etiquetas: { "DT-1372": "Verde", "DT-1371": "Negro" } },
  { nombre: "Mosquetón", piezas: ["DT-1380", "DT-1379", "DT-1378"], etiquetas: { "DT-1380": "Verde", "DT-1379": "Negro", "DT-1378": "Kaki" } },
  { nombre: "Silla táctica", piezas: ["DT-1384", "DT-1383"], etiquetas: { "DT-1384": "Verde", "DT-1383": "Negra" } }
];

function grupoDe(id) {
  return DT_GRUPOS.find((grupo) => grupo.piezas.includes(id) || (grupo.apoyo || []).includes(id) || (grupo.referencia || []).some((foto) => foto.id === id)) || null;
}

function principalDe(id) {
  const grupo = grupoDe(id);
  return grupo ? grupo.piezas[0] : id;
}

function etiquetaDe(grupo, id) {
  return (grupo.etiquetas && grupo.etiquetas[id]) || (grupo.etiquetasApoyo && grupo.etiquetasApoyo[id]) || (product(id) ? product(id).name : id);
}

function idsDelGrupo(grupo) {
  return [...grupo.piezas, ...(grupo.apoyo || []), ...(grupo.referencia || []).map((foto) => foto.id)];
}

window.dtGrupo = grupoDe;
window.dtPrincipal = principalDe;

function renderPublic() {
  const ocultos = new Set();
  DT_GRUPOS.forEach((grupo) => {
    grupo.piezas.slice(1).forEach((id) => ocultos.add(id));
    (grupo.apoyo || []).forEach((id) => ocultos.add(id));
  });
  const visibles = PRODUCTS.filter((item) => !ocultos.has(item.id));
  const filters = document.querySelector("[data-catalog-filters]");
  const grid = document.querySelector("[data-catalog-grid]");
  if (filters && grid) {
    const counts = {};
    visibles.forEach((item) => {
      counts[item.slug] = (counts[item.slug] || 0) + 1;
    });
    filters.innerHTML = [`<button class="filter is-active" type="button" data-filter="todos" aria-pressed="true">Todas <b>${visibles.length}</b></button>`,
      ...LINES.map((line) => {
        const slug = PRODUCTS.find((item) => item.line === line)?.slug || "";
        return `<button class="filter" type="button" data-filter="${slug}" data-label="${escapeHtml(line)}" aria-pressed="false">${escapeHtml(line)} <b>${counts[slug] || 0}</b></button>`;
      })].join("");
    grid.innerHTML = visibles.map((item) => {
      const grupo = grupoDe(item.id);
      const titulo = grupo ? grupo.nombre : item.name;
      const piezas = grupo ? grupo.piezas.map((id) => product(id)).filter(Boolean) : [item];
      const apoyo = grupo ? (grupo.apoyo || []).map((id) => product(id)).filter(Boolean) : [];
      const ids = [...piezas, ...apoyo].map((entry) => entry.id).join(" ");
      const colores = grupo ? `<div class="variant-row">${piezas.map((entry) => `<a href="${root}producto.html?id=${entry.id}"><img src="${productImage(entry)}" alt="" data-product="${entry.id}"><span>${escapeHtml(etiquetaDe(grupo, entry.id))}</span></a>`).join("")}</div>` : "";
      const frame = item.photo === false
        ? `<div class="plate plate-photo plate-missing"><span>Foto por reemplazar</span></div>`
        : `<a class="plate plate-photo" href="${root}producto.html?id=${item.id}"><img src="${productImage(item)}" alt="${escapeHtml(titulo)}" loading="lazy" data-product="${item.id}"></a>`;
      const junto = grupo && grupo.junto ? ` data-add-junto="${grupo.piezas.slice(1).join(" ")}"` : "";
      return `<article class="card" data-cat="${item.slug}" data-ids="${ids}">
      ${frame}
      <div class="card-body">
        <p class="card-kicker"><span>${item.id}</span><span>${escapeHtml(item.line)}</span></p>
        <h3>${escapeHtml(titulo)}</h3>
        ${colores}
        <p class="price" data-price="${item.id}">${priceLabel(item)}</p>
        <a class="consult" href="${root}producto.html?id=${item.id}">${window.DT_VISTAS && window.DT_VISTAS[item.id] ? "Ver en 360" : "Ver foto"}</a>
        ${window.DT_VISTAS && window.DT_VISTAS[item.id] ? `<a class="consult" href="${root}probar.html?id=${item.id}">Probar</a>` : ""}
        <button class="cart-add" type="button" data-add="${item.id}"${junto}>Añadir al carrito</button>
        <a class="consult" data-wa-text="Hola, quiero información de la referencia ${item.id}, ${titulo}.">Consultar referencia</a>
      </div>
    </article>`;
    }).join("");
    const count = document.querySelector("[data-count]");
    if (count) count.textContent = visibles.length === 1 ? "1 referencia" : `${visibles.length} referencias`;
  }
  const bar = document.querySelector("[data-stage-bar]");
  if (bar) {
    bar.innerHTML = LINES.map((line, index) => {
      const slug = PRODUCTS.find((item) => item.line === line)?.slug || "";
      return `<a href="${root}catalogo.html?linea=${slug}"><span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(line)}</a>`;
    }).join("");
  }
  const board = document.querySelector("[data-line-board]");
  if (board) {
    board.innerHTML = LINES.map((line) => {
      const group = visibles.filter((item) => item.line === line);
      const item = group.find((entry) => entry.photo !== false) || group[0];
      if (!item) return "";
      return `<article class="line-card" id="${item.slug}"><img src="${productImage(item)}" alt="${escapeHtml(line)}" data-product="${item.id}"><div><h2>${escapeHtml(line)}</h2><p>${group.length} referencias.</p><a class="btn btn-metal line-open" href="${root}catalogo.html?linea=${item.slug}">Abrir línea</a></div></article>`;
    }).join("");
  }
  const mosaic = document.querySelector("[data-home-mosaic]");
  const thumbs = document.querySelector("[data-home-thumbs]");
  if (mosaic && thumbs) {
    const picks = LINES.map((line) => PRODUCTS.find((item) => item.line === line && item.photo !== false) || PRODUCTS.find((item) => item.line === line)).filter(Boolean);
    const tile = (item, extra) => `<article class="tile ${extra}"><a class="tile-hit" href="${root}producto.html?id=${item.id}"><img src="${productImage(item)}" alt="${escapeHtml(item.name)}" data-product="${item.id}"><span class="tile-copy"><span>${item.id} · ${escapeHtml(item.line)}</span><strong>${escapeHtml(item.name)}</strong><em>Gire la pieza en su ficha.</em></span></a><button class="cart-add" type="button" data-add="${item.id}">Añadir al carrito</button></article>`;
    mosaic.innerHTML = picks.slice(0, 6).map((item, index) => tile(item, index === 0 ? "tile-lead" : index === 5 ? "tile-wide" : "")).join("");
    thumbs.innerHTML = picks.slice(6, 12).map((item) => `<a class="thumb" href="${root}producto.html?id=${item.id}"><img src="${productImage(item)}" alt="" data-product="${item.id}"><span>${item.id} · ${escapeHtml(item.line)}</span><strong>${escapeHtml(item.name)}</strong></a>`).join("");
  }
  const interest = document.querySelector("[data-interest]");
  if (interest) {
    interest.innerHTML = `<option value="" selected disabled>Seleccione una línea</option>${LINES.map((line) => `<option>${escapeHtml(line)}</option>`).join("")}<option>Dotación completa</option><option>Otra consulta</option>`;
  }
}

document.addEventListener("error", (event) => {
  const img = event.target;
  if (!img || img.tagName !== "IMG" || !img.dataset.product || img.dataset.full) return;
  const item = product(img.dataset.product);
  if (!item || !item.image) return;
  img.dataset.full = "1";
  img.src = photoUrls.get(item.id) || `${root}${item.image}`;
}, true);

renderPublic();
mountMenuSearch();
beginTrace();
applyAdvisorPhone();
paintCount();
paintPrices();
renderCart();
renderCheckout();
paintAccount();
paintLang();
renderAdmin();
loadTrm();
loadPhotos().then(() => {
  applyPhotos();
  paintPhotoDesk();
}).catch(() => {});
