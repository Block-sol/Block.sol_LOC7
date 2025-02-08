import reactHotToast from "react-hot-toast";

export const toast = (type: "success" | "error", msg: string ) => {
  


  switch (type) {
    case "success":
      reactHotToast.success(msg);
      break;
    case "error":
      reactHotToast.error(msg);
      break;
    default:
      reactHotToast(msg);
  }
};
