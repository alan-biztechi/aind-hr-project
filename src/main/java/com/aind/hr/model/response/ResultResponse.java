package com.aind.hr.model.response;

import com.aind.hr.constant.SuccessFlag;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResultResponse {
    private SuccessFlag success;
    private String message;
}
