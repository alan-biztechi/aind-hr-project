package com.aind.hr.model.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
public class AttendanceCheckInRequest {

    @Schema(description = "직원 ID", example = "1")
    @NotNull(message = "직원 ID는 필수입니다.")
    private Integer employeeId;

    @Schema(description = "근무일", example = "2026-04-01")
    @NotNull(message = "근무일은 필수입니다.")
    private LocalDate workDate;

    @Schema(description = "출근 시각", example = "09:00")
    @NotNull(message = "출근 시각은 필수입니다.")
    private LocalTime checkIn;
}
