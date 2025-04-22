import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/students/",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  },
});

export const getQuizzes = () => api.get("quizzes/");
export const submitQuizResult = (data) => api.post("submit/", data);
