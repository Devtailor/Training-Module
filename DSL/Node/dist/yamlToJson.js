"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const yaml_1 = require("yaml");
const base64ToText_1 = __importDefault(require("./base64ToText"));
const router = express_1.default.Router();
router.post('/', (0, multer_1.default)().array('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = (0, base64ToText_1.default)(req.body.file);
    let result = (0, yaml_1.parse)(file);
    res.send(result);
}));
exports.default = router;
