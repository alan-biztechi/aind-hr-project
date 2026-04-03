package com.aind.hr.model.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class EmployeeUpdateRequest {

    @Schema(description = "직원 ID", example = "1")
    @NotNull(message = "직원 ID는 필수입니다.")
    @Min(value = 1, message = "올바른 직원 ID를 입력하세요.")
    private Integer id;

    @Schema(description = "이름", example = "홍길동")
    @NotBlank(message = "이름은 필수입니다.")
    @Size(max = 50)
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

    @Schema(description = "직급", example = "대리")
    @NotBlank(message = "직급은 필수입니다.")
    private String position;

    @Schema(description = "상태 (ACTIVE/RESIGNED)", example = "ACTIVE")
    @NotBlank(message = "상태는 필수입니다.")
    private String status;
}
