package com.aind.hr.model.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
public class EmployeeCreateRequest {

    @Schema(description = "이름", example = "홍길동")
    @NotBlank(message = "이름은 필수입니다.")
    @Size(max = 50, message = "이름은 50자 이내로 작성해야 합니다.")
    private String name;

    @Schema(description = "이메일", example = "gildong.hong@aind.co.kr")
    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식을 입력하세요.")
    private String email;

    @Schema(description = "전화번호", example = "010-9999-0001")
    private String phone;

    @Schema(description = "부서 ID", example = "1")
    @NotNull(message = "부서 ID는 필수입니다.")
    private Integer departmentId;

    @Schema(description = "직급 (사원/대리/과장/차장/부장)", example = "사원")
    @NotBlank(message = "직급은 필수입니다.")
    private String position;

    @Schema(description = "입사일", example = "2026-04-01")
    @NotNull(message = "입사일은 필수입니다.")
    private LocalDate hireDate;
}
