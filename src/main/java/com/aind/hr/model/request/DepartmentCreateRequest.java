package com.aind.hr.model.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class DepartmentCreateRequest {

    @Schema(description = "부서명", example = "마케팅팀")
    @NotBlank(message = "부서명은 필수입니다.")
    @Size(max = 50, message = "부서명은 50자 이내로 작성해야 합니다.")
    private String name;

    @Schema(description = "부서 설명", example = "마케팅 전략 수립 및 실행")
    @Size(max = 200, message = "설명은 200자 이내로 작성해야 합니다.")
    private String description;
}
