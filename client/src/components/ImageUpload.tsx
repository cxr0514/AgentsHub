import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  propertyId?: number;
  onImagesUploaded?: (images: any[]) => void;
  className?: string;
  buttonText?: string;
  disabled?: boolean;
}

export function ImageUpload({
  propertyId,
  onImagesUploaded,
  className,
  buttonText = "Upload images",
  disabled = false,
}: ImageUploadProps) {
  const [images, setImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    // Preview the images
    const newPreviewImages: string[] = [];
    const fileArray = Array.from(selectedFiles);

    for (const file of fileArray) {
      // Validate file type
      if (!file.type.match('image.*')) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not an image.`,
          variant: 'destructive',
        });
        continue;
      }

      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 10MB limit.`,
          variant: 'destructive',
        });
        continue;
      }

      newPreviewImages.push(URL.createObjectURL(file));
    }

    setPreviewImages([...previewImages, ...newPreviewImages]);
    setImages([...images, ...fileArray]);

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(previewImages[index]);

    // Remove the image from both arrays
    const newPreviewImages = [...previewImages];
    newPreviewImages.splice(index, 1);
    setPreviewImages(newPreviewImages);

    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const uploadImages = async () => {
    if (!propertyId || images.length === 0) return;

    setUploading(true);

    try {
      const formData = new FormData();
      for (const image of images) {
        formData.append('images', image);
      }

      const response = await fetch(`/api/properties/${propertyId}/images`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload images');
      }

      const result = await response.json();
      
      toast({
        title: 'Success',
        description: `Uploaded ${result.images.length} images`,
      });

      // Clear the images after successful upload
      setImages([]);
      
      // Clear previews and revoke URLs
      previewImages.forEach(url => URL.revokeObjectURL(url));
      setPreviewImages([]);

      // Notify parent component
      if (onImagesUploaded) {
        onImagesUploaded(result.images);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload images',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || uploading}
        />
        
        <Button 
          type="button"
          variant="outline" 
          onClick={handleButtonClick}
          disabled={disabled || uploading}
          className="bg-[#071224] text-white border-[#0f1d31] hover:bg-[#0f1d31]"
        >
          <Upload className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
        
        {propertyId && images.length > 0 && (
          <Button 
            type="button"
            onClick={uploadImages}
            disabled={uploading || disabled}
            className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white"
          >
            {uploading ? 'Uploading...' : `Save ${images.length} images`}
          </Button>
        )}
      </div>

      {previewImages.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {previewImages.map((src, index) => (
            <Card key={index} className="overflow-hidden bg-[#071224] border-[#0f1d31]">
              <CardContent className="p-2 relative">
                <div className="relative aspect-square">
                  <img 
                    src={src} 
                    alt={`Preview ${index + 1}`} 
                    className="object-cover w-full h-full rounded-sm"
                  />
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!images.length && (
        <div className="flex items-center justify-center border border-dashed rounded-md p-8 border-[#0f1d31]">
          <div className="flex flex-col items-center text-slate-400">
            <Image className="h-8 w-8 mb-2" />
            <p className="text-sm">No images selected</p>
          </div>
        </div>
      )}
    </div>
  );
}