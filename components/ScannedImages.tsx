"use client";

import type React from "react";
import { useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { ScannedImage } from "./scanner/Dropdown";
import DeleteAllImages from "./DeleteAllImages";
import { useTranslation } from "react-i18next";

interface ScannedImagesProps {
  images: ScannedImage[];
  isScanning: boolean;
  onImageClick?: (image: ScannedImage) => void;
  selectedImageId?: string | null;
  isImageSelected?: (imageId: string) => boolean;
  onToggleSelection?: (imageId: string) => void;
  onDeleteImage?: (imageId: string) => void;
  deleteAllImages?: () => void;
}

export const ScannedImages: React.FC<ScannedImagesProps> = ({
  images,
  isScanning,
  onImageClick,
  selectedImageId,
  isImageSelected,
  onToggleSelection,
  onDeleteImage,
  deleteAllImages,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { t } = useTranslation();
  const [imageToDelete, setImageToDelete] = useState<{
    id: string;
    index: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleImageClick = (image: ScannedImage, e: React.MouseEvent) => {
    // Check if clicking on delete button
    if ((e.target as HTMLElement).closest(".delete-button")) {
      return;
    }

    // Handle selection toggle if function provided
    if (onToggleSelection) {
      onToggleSelection(image.id);
    }

    // Handle regular image click
    if (onImageClick) {
      onImageClick(image);
    }
  };

  const handleDeleteClick = (
    imageId: string,
    imageIndex: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    if (onDeleteImage) {
      setImageToDelete({ id: imageId, index: imageIndex + 1 }); // 1-based index
      setShowDeleteModal(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!imageToDelete || !onDeleteImage) return;

    try {
      setIsDeleting(true);
      await onDeleteImage(imageToDelete.id);
      setShowDeleteModal(false);
      setImageToDelete(null);
    } catch (error) {
      console.error("Failed to delete image:", error);
      // Keep modal open on error
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (isDeleting) return;
    setShowDeleteModal(false);
    setImageToDelete(null);
  };

  if (images.length === 0 && !isScanning) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-gray-500 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">{t("noDocumentLoaded")}</p>
          <p className="text-sm">{t("clickScanOrImport")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 h-full overflow-auto">
        {images.length > 0 && !isScanning && (
          <>
            <div className="flex items-center justify-end">
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className=" w-fit text-xs cursor-pointer font-semibold text-white bg-red-600 hover:bg-red-700 rounded px-4 py-2 transition-colors"
              >
                {t("clearAllImages")}
              </button>
            </div>
            <hr className="my-2" />
          </>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((image, index) => {
            const isCurrentlySelected = selectedImageId === image.id;
            const isToggleSelected = isImageSelected
              ? isImageSelected(image.id)
              : false;

            return (
              <div
                key={image.id}
                className={`bg-white border rounded-lg shadow-sm overflow-hidden cursor-pointer transition-all relative group ${
                  isCurrentlySelected
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : isToggleSelected
                      ? "border-green-500 ring-2 ring-green-200"
                      : "border-gray-300 hover:border-gray-400"
                }`}
                onClick={(e) => handleImageClick(image, e)}
              >
                <div className="aspect-[3/4] relative">
                  <img
                    src={image.dataUrl}
                    alt={`Page ${index + 1}`}
                    className="w-full h-full object-contain bg-gray-50"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                    }}
                  />
                  <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {t("page", { index: index + 1 })}
                  </div>
                  <div
                    className={`absolute top-2 right-2 text-white text-xs px-2 py-1 rounded
                 ${image.id.startsWith("import-") ? "bg-blue-600" : "bg-green-600"}`}
                  >
                    {image.id.startsWith("import-")
                      ? t("imported")
                      : t("scanned")}
                  </div>

                  {/* Delete button - only visible on hover */}
                  {onDeleteImage && (
                    <button
                      className="delete-button absolute bottom-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={(e) => handleDeleteClick(image.id, index, e)}
                      title={t("deleteImage")}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}

                  {/* Selection indicators */}
                  {isCurrentlySelected && (
                    <div className="absolute inset-0 bg-opacity-10 flex items-center justify-center">
                      <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        {t("selected")}
                      </div>
                    </div>
                  )}

                  {isToggleSelected && !isCurrentlySelected && (
                    <div className="absolute inset-0 bg-green-500 bg-opacity-10 flex items-center justify-center">
                      <div className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                        ✓
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs text-gray-500">
                    {new Date(image.timestamp).toLocaleTimeString()}
                  </p>
                  {isToggleSelected && (
                    <p className="text-xs text-green-600 font-medium">
                      {t("selectedForOperations")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        imageIndex={imageToDelete?.index || 1}
        isDeleting={isDeleting}
      />

      <DeleteAllImages
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={deleteAllImages || (() => {})}
      />
    </>
  );
};
