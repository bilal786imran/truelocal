import { supabase } from "./supabase"

export const uploadAvatar = async (file: File, userId: string) => {
  const fileExt = file.name.split(".").pop()
  const fileName = `${userId}/avatar.${fileExt}`

  const { data, error } = await supabase.storage.from("avatars").upload(fileName, file, {
    upsert: true,
  })

  if (error) {
    throw error
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(fileName)

  return publicUrl
}

export const uploadServiceImage = async (file: File, userId: string, serviceId: string, index: number) => {
  const fileExt = file.name.split(".").pop()
  const fileName = `${userId}/${serviceId}/image-${index}.${fileExt}`

  const { data, error } = await supabase.storage.from("service-images").upload(fileName, file, {
    upsert: true,
  })

  if (error) {
    throw error
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("service-images").getPublicUrl(fileName)

  return publicUrl
}

export const deleteServiceImages = async (userId: string, serviceId: string) => {
  const { error } = await supabase.storage.from("service-images").remove([`${userId}/${serviceId}`])

  if (error) {
    throw error
  }
}
