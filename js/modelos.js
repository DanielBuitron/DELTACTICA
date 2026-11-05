/* Registro de modelos 3D propios, en GLB.
   Una camisa o un pantalón sin archivo se construye con volumen sobre el cuerpo.
   Para reemplazar esa construcción por un modelo hecho en Blender:
   window.DT_MODELOS["DT-1307"] = { archivo: "modelos/dt-1307.glb", ancla: "pecho", escala: 1 };
   Anclas: cabeza, cuello, pecho, cintura, cadera, manoI, manoD, pieI, pieD.
   El archivo tiene que estar exportado en la misma pose y en metros. */
window.DT_MODELOS = window.DT_MODELOS || {};
