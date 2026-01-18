import { useState } from "react";

export function userFormInput<T>(initialState: T) {
  const [formData, setFormData] = useState<T>(initialState);

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type } = event.target;

    setFormData({
      ...formData,
      [name]: type === "number" ? Number(value) : value,
    });
  }

  function resetForm() {
    setFormData(initialState);
  }

  return { formData, handleInputChange, setFormData, resetForm };
}
