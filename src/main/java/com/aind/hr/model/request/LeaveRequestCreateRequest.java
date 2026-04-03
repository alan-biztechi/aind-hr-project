package com.aind.hr.model.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
public class LeaveRequestCreateRequest {

    @Schema(description = "직원 ID", example = "3")
    @NotNull(message = "직원 ID는 필수입니다.")
    private Integer employeeId;

    @Schema(description = "휴가 유형 (연차/반차/병가/경조사)", example = "연차")
    @NotBlank(message = "휴가 유형은 필수입니다.")
    private String leaveType;

    @Schema(description = "시작일", example = "2026-04-10")
    @NotNull(message = "시작일은 필수입니다.")
    private LocalDate startDate;

    @Schema(description = "종료일", example = "2026-04-11")
    @NotNull(message = "종료일은 필수입니다.")
    private LocalDate endDate;

    @Schema(description = "사유", example = "개인 사유")
    @Size(max = 500, message = "사유는 500자 이내로 작성해야 합니다.")
    private String reason;
}
