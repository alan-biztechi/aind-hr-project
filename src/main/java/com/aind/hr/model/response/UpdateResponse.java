package com.aind.hr.model.response;

import com.aind.hr.constant.SuccessFlag;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateResponse extends ResultResponse {

    private Integer id;

    public UpdateResponse(SuccessFlag success, String message, Integer id) {
        super(success, message);
        this.id = id;
    }
}
