package com.example.talentflowbackend.validation;

import com.example.talentflowbackend.dto.ProposalSubmitRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProposalSubmitRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    @DisplayName("VAL-PROPOSAL-01: A complete proposal request passes validation")
    void validRequest_hasNoViolations() {
        ProposalSubmitRequest request = validRequest();

        Set<ConstraintViolation<ProposalSubmitRequest>> violations = validator.validate(request);

        assertTrue(violations.isEmpty(), "Expected no constraint violations for a valid proposal request");
    }

    @Test
    @DisplayName("VAL-PROPOSAL-02: Proposal request rejects invalid fields")
    void invalidRequest_reportsExpectedMessages() {
        ProposalSubmitRequest request = new ProposalSubmitRequest();
        request.setJobId(" ");
        request.setProposedBudget(0.0);
        request.setEstimatedDeliveryDays(0);
        request.setCoverLetter("Too short");
        request.setAttachmentFileName("proposal.txt");
        request.setAttachmentContentType(" ");
        request.setAttachmentBase64(" ");

        Set<String> messages = validator.validate(request)
                .stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.toSet());

        assertEquals(7, messages.size());
        assertTrue(messages.contains("Job id is required"));
        assertTrue(messages.contains("Budget must be greater than 0"));
        assertTrue(messages.contains("Delivery time must be greater than 0"));
        assertTrue(messages.contains("Cover letter must be between 20 and 5000 characters"));
        assertTrue(messages.contains("Attachment file must be a PDF"));
        assertTrue(messages.contains("Attachment content type is required"));
        assertTrue(messages.contains("PDF content is required"));
    }

    private ProposalSubmitRequest validRequest() {
        ProposalSubmitRequest request = new ProposalSubmitRequest();
        request.setJobId("job-1");
        request.setProposedBudget(1000.0);
        request.setEstimatedDeliveryDays(7);
        request.setCoverLetter("I can complete this proposal with a solid implementation plan.");
        request.setAttachmentFileName("proposal.pdf");
        request.setAttachmentContentType("application/pdf");
        request.setAttachmentBase64("c2FtcGxlLXBkZg==");
        return request;
    }
}