package com.example.talentflowbackend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProposalSubmitRequest {

    @NotBlank(message = "Job id is required")
    @Size(max = 80, message = "Job id is too long")
    private String jobId;

    @NotNull(message = "Budget is required")
    @DecimalMin(value = "0.01", message = "Budget must be greater than 0")
    private Double proposedBudget;

    @NotNull(message = "Estimated delivery time is required")
    @Min(value = 1, message = "Delivery time must be greater than 0")
    private Integer estimatedDeliveryDays;

    @NotBlank(message = "Cover letter is required")
    @Size(min = 20, max = 5000, message = "Cover letter must be between 20 and 5000 characters")
    private String coverLetter;

    @NotBlank(message = "PDF file name is required")
    @Pattern(regexp = "(?i)^.+\\.pdf$", message = "Attachment file must be a PDF")
    private String attachmentFileName;

    @NotBlank(message = "Attachment content type is required")
    private String attachmentContentType;

    @NotBlank(message = "PDF content is required")
    private String attachmentBase64;
}
